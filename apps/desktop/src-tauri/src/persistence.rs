use crate::geometry::SavedGeometry;
use std::{
    fs,
    io::{self, Read, Write},
    path::{Path, PathBuf},
    sync::mpsc::{self, RecvTimeoutError, Sender},
    time::Duration,
};

const MAX_FILE_BYTES: u64 = 16 * 1024;
const SAVE_DELAY: Duration = Duration::from_millis(300);

pub fn read(path: &Path) -> Option<SavedGeometry> {
    let file = fs::File::open(path).ok()?;
    if file.metadata().ok()?.len() > MAX_FILE_BYTES {
        return None;
    }
    let mut contents = String::new();
    file.take(MAX_FILE_BYTES)
        .read_to_string(&mut contents)
        .ok()?;
    serde_json::from_str::<SavedGeometry>(&contents)
        .ok()?
        .validated()
}

fn write(path: &Path, geometry: SavedGeometry) -> io::Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| io::Error::other("missing app-data directory"))?;
    fs::create_dir_all(parent)?;
    let temporary_path = path.with_extension("json.tmp");
    let mut temporary = fs::File::create(&temporary_path)?;
    serde_json::to_writer_pretty(&mut temporary, &geometry)?;
    temporary.write_all(b"\n")?;
    temporary.sync_all()?;
    drop(temporary);
    // A partial write never replaces the previous valid save.
    fs::rename(temporary_path, path)
}

enum Request {
    Save(SavedGeometry),
    Flush(Sender<()>),
}

pub struct GeometryPersistence {
    sender: Sender<Request>,
}

impl GeometryPersistence {
    pub fn start(path: PathBuf) -> io::Result<Self> {
        let (sender, receiver) = mpsc::channel();
        std::thread::Builder::new()
            .name("amyu-window-save".into())
            .spawn(move || {
                let mut pending = None;
                let mut last_saved = None;
                let persist =
                    |pending: &mut Option<SavedGeometry>,
                     last_saved: &mut Option<SavedGeometry>| {
                        if let Some(value) = pending.take() {
                            if Some(value) != *last_saved {
                                match write(&path, value) {
                                    Ok(()) => *last_saved = Some(value),
                                    Err(error) => {
                                        eprintln!("AMYU could not save pet geometry: {error}")
                                    }
                                }
                            }
                        }
                    };
                loop {
                    let received = if pending.is_some() {
                        receiver.recv_timeout(SAVE_DELAY)
                    } else {
                        receiver.recv().map_err(|_| RecvTimeoutError::Disconnected)
                    };
                    match received {
                        Ok(Request::Save(value)) => pending = Some(value),
                        Ok(Request::Flush(done)) => {
                            persist(&mut pending, &mut last_saved);
                            let _ = done.send(());
                        }
                        Err(RecvTimeoutError::Timeout) => persist(&mut pending, &mut last_saved),
                        Err(RecvTimeoutError::Disconnected) => {
                            persist(&mut pending, &mut last_saved);
                            break;
                        }
                    }
                }
            })?;
        Ok(Self { sender })
    }

    pub fn save(&self, geometry: SavedGeometry) {
        let _ = self.sender.send(Request::Save(geometry));
    }

    pub fn flush(&self) {
        let (done, receiver) = mpsc::channel();
        if self.sender.send(Request::Flush(done)).is_ok() {
            // A slow or unavailable disk must not trap the user in the pet.
            let _ = receiver.recv_timeout(Duration::from_secs(1));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn save_flush_reload_and_corrupt_fallback() {
        let unique = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let directory =
            std::env::temp_dir().join(format!("amyu-geometry-{}-{unique}", std::process::id()));
        let path = directory.join("pet-window.json");
        assert_eq!(read(&path), None);
        let store = GeometryPersistence::start(path.clone()).unwrap();
        let first = SavedGeometry {
            version: 1,
            x: -100,
            y: 50,
            width: 360.0,
            height: 460.0,
        };
        store.save(first);
        store.flush();
        assert_eq!(read(&path), Some(first));
        let latest = SavedGeometry {
            x: 30,
            width: 500.0,
            ..first
        };
        store.save(first);
        store.save(latest);
        store.flush();
        assert_eq!(read(&path), Some(latest));
        fs::write(&path, b"{ incomplete").unwrap();
        assert_eq!(read(&path), None);
        fs::write(&path, vec![b' '; MAX_FILE_BYTES as usize + 1]).unwrap();
        assert_eq!(read(&path), None);
        drop(store);
        fs::remove_file(&path).unwrap();
        fs::remove_dir(&directory).unwrap();
    }
}
