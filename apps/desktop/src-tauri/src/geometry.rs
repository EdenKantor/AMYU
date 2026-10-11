use serde::{Deserialize, Serialize};

pub const DEFAULT_WIDTH: f64 = 360.0;
pub const DEFAULT_HEIGHT: f64 = 460.0;
pub const MIN_WIDTH: f64 = 300.0;
pub const MIN_HEIGHT: f64 = 360.0;
pub const MAX_WIDTH: f64 = 560.0;
pub const MAX_HEIGHT: f64 = 700.0;

/// Position is in physical desktop pixels; size is in logical pixels so moving
/// between displays preserves the pet's apparent size at the new display DPI.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SavedGeometry {
    pub version: u8,
    pub x: i32,
    pub y: i32,
    pub width: f64,
    pub height: f64,
}

impl SavedGeometry {
    pub fn validated(self) -> Option<Self> {
        if self.version != 1
            || !self.width.is_finite()
            || !self.height.is_finite()
            || self.width <= 0.0
            || self.height <= 0.0
        {
            return None;
        }
        Some(Self {
            width: self.width.clamp(MIN_WIDTH, MAX_WIDTH),
            height: self.height.clamp(MIN_HEIGHT, MAX_HEIGHT),
            ..self
        })
    }
}

#[derive(Debug, Clone, Copy)]
pub struct WorkArea {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale: f64,
}

impl WorkArea {
    fn usable(&self) -> bool {
        self.width > 0 && self.height > 0 && self.scale.is_finite() && self.scale > 0.0
    }

    fn intersection(&self, saved: SavedGeometry) -> f64 {
        let left = (saved.x as f64).max(self.x as f64);
        let top = (saved.y as f64).max(self.y as f64);
        let right =
            (saved.x as f64 + saved.width * self.scale).min(self.x as f64 + self.width as f64);
        let bottom =
            (saved.y as f64 + saved.height * self.scale).min(self.y as f64 + self.height as f64);
        (right - left).max(0.0) * (bottom - top).max(0.0)
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RestoredGeometry {
    pub saved: SavedGeometry,
    pub scale: f64,
    pub min_width: f64,
    pub min_height: f64,
}

/// Callers put the primary display first. A missing display uses that safe
/// default, while a partially visible pet is clamped wholly into its work area.
/// The taskbar is already excluded by the native monitor work-area API.
pub fn restore(saved: Option<SavedGeometry>, monitors: &[WorkArea]) -> Option<RestoredGeometry> {
    let saved = saved.and_then(SavedGeometry::validated);
    let mut areas = monitors.iter().filter(|area| area.usable());
    let default_area = *areas.next()?;
    let mut area = default_area;
    let mut best_overlap = saved.map_or(0.0, |value| area.intersection(value));
    for candidate in areas {
        let overlap = saved.map_or(0.0, |value| candidate.intersection(value));
        if overlap > best_overlap {
            best_overlap = overlap;
            area = *candidate;
        }
    }

    let available_width = area.width as f64 / area.scale;
    let available_height = area.height as f64 / area.scale;
    // On exceptionally small work areas, visibility takes precedence over the
    // normal comfort minimum; the native minimum is reduced to the same bound.
    let width = saved
        .map_or(DEFAULT_WIDTH, |value| value.width)
        .min(available_width);
    let height = saved
        .map_or(DEFAULT_HEIGHT, |value| value.height)
        .min(available_height);
    let max_x = area.x as f64 + area.width as f64 - (width * area.scale).round();
    let max_y = area.y as f64 + area.height as f64 - (height * area.scale).round();
    let inset = 16.0 * area.scale;
    let desired = saved.filter(|_| best_overlap > 0.0);
    let x = desired.map_or(max_x - inset, |value| value.x as f64);
    let y = desired.map_or(max_y - inset, |value| value.y as f64);

    Some(RestoredGeometry {
        saved: SavedGeometry {
            version: 1,
            x: x.clamp(area.x as f64, max_x.max(area.x as f64)).round() as i32,
            y: y.clamp(area.y as f64, max_y.max(area.y as f64)).round() as i32,
            width,
            height,
        },
        scale: area.scale,
        min_width: MIN_WIDTH.min(available_width),
        min_height: MIN_HEIGHT.min(available_height),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn primary() -> WorkArea {
        WorkArea {
            x: 0,
            y: 0,
            width: 1920,
            height: 1040,
            scale: 1.0,
        }
    }

    fn saved(x: i32, y: i32, width: f64, height: f64) -> SavedGeometry {
        SavedGeometry {
            version: 1,
            x,
            y,
            width,
            height,
        }
    }

    #[test]
    fn first_launch_avoids_taskbar_and_screen_edges() {
        let result = restore(None, &[primary()]).unwrap().saved;
        assert_eq!(result, saved(1544, 564, 360.0, 460.0));
    }

    #[test]
    fn invalid_and_future_schema_restore_defaults() {
        for invalid in [
            saved(10, 10, f64::NAN, 400.0),
            saved(10, 10, 400.0, f64::INFINITY),
            saved(10, 10, -1.0, 400.0),
            SavedGeometry {
                version: 2,
                ..saved(10, 10, 400.0, 400.0)
            },
        ] {
            assert_eq!(
                restore(Some(invalid), &[primary()]),
                restore(None, &[primary()])
            );
        }
        assert!(serde_json::from_str::<SavedGeometry>(
            r#"{"version":1,"x":0,"y":0,"width":360,"height":460,"extra":true}"#
        )
        .is_err());
        assert!(serde_json::from_str::<SavedGeometry>(
            r#"{"version":1,"x":999999999999,"y":0,"width":360,"height":460}"#
        )
        .is_err());
    }

    #[test]
    fn valid_saved_geometry_is_preserved() {
        let value = saved(150, 120, 420.0, 530.0);
        assert_eq!(restore(Some(value), &[primary()]).unwrap().saved, value);
    }

    #[test]
    fn disconnected_monitor_returns_to_primary_without_losing_size() {
        let result = restore(Some(saved(5000, -3000, 420.0, 530.0)), &[primary()])
            .unwrap()
            .saved;
        assert_eq!(result, saved(1484, 494, 420.0, 530.0));
    }

    #[test]
    fn negative_monitor_coordinates_are_valid() {
        let left = WorkArea {
            x: -1920,
            ..primary()
        };
        let value = saved(-1750, 150, 400.0, 500.0);
        assert_eq!(
            restore(Some(value), &[primary(), left]).unwrap().saved,
            value
        );
    }

    #[test]
    fn dpi_uses_logical_size_and_clamps_to_physical_work_area() {
        let high_dpi = WorkArea {
            x: 1920,
            y: 0,
            width: 2560,
            height: 1400,
            scale: 2.0,
        };
        let result = restore(
            Some(saved(4400, 1300, 400.0, 500.0)),
            &[primary(), high_dpi],
        )
        .unwrap();
        assert_eq!(result.saved, saved(3680, 400, 400.0, 500.0));
        assert_eq!(result.scale, 2.0);
    }

    #[test]
    fn oversized_and_undersized_values_are_bounded() {
        let result = restore(Some(saved(0, 0, 9000.0, 1.0)), &[primary()])
            .unwrap()
            .saved;
        assert_eq!((result.width, result.height), (MAX_WIDTH, MIN_HEIGHT));
    }

    #[test]
    fn tiny_work_area_reduces_minimum_to_remain_recoverable() {
        let tiny = WorkArea {
            width: 400,
            height: 300,
            scale: 2.0,
            ..primary()
        };
        let result = restore(None, &[tiny]).unwrap();
        assert_eq!(result.saved, saved(0, 0, 200.0, 150.0));
        assert_eq!((result.min_width, result.min_height), (200.0, 150.0));
    }

    #[test]
    fn missing_or_invalid_monitor_data_is_handled_without_panicking() {
        assert!(restore(None, &[]).is_none());
        assert!(restore(
            None,
            &[WorkArea {
                scale: f64::NAN,
                ..primary()
            }]
        )
        .is_none());
        assert!(restore(
            None,
            &[WorkArea {
                height: 0,
                ..primary()
            }]
        )
        .is_none());
    }
}
