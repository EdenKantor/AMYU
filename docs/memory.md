# Memory boundary — reserved

No durable memory is implemented. The repository contract separates working, profile, preference, episodic, relationship, project and procedural records, with confidence, importance, sensitivity, source and timestamps.

Future operations are remember, recall, correct, forget, inspect and update. Do not save every conversation automatically. Explicit corrections override inferred memory; explicit configuration overrides inferred preferences. Users must be able to inspect and correct memory. Avoid unnecessary sensitive inference and do not use relationship memory to manipulate the user.

Start with profile, explicit facts, preferences, projects and relationship preferences. Storage stays behind a repository boundary; complex vector/RAG infrastructure requires demonstrated need.
