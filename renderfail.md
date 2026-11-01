
> @freellmapi/server@0.2.1 start
> node dist/index.js
◇ injected env (0) from ../.env // tip: ⌁ auth for agents [www.vestauth.com]
(node:84) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.
To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'
See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
Database initialized using PostgreSQL
Server running on http://[::]:3001
Proxy endpoint: http://[::]:3001/v1/chat/completions
[Health] Starting health checker (every 300s)
[Error] function datetime(unknown, unknown) does not exist
/opt/render/project/src/node_modules/pg-pool/index.js:45
    Error.captureStackTrace(err)
          ^
error: function julianday(unknown) does not exist
    at /opt/render/project/src/node_modules/pg-pool/index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async PgStatement.all (file:///opt/render/project/src/server/dist/db/pg-wrapper.js:80:24)
    at async refreshStatsCache (file:///opt/render/project/src/server/dist/services/router.js:153:22) {
  length: 211,
  severity: 'ERROR',
  code: '42883',
  detail: undefined,
  hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
  position: '45',
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'parse_func.c',
  line: '629',
  routine: 'ParseFuncOrColumn'
}
Node.js v24.14.1
npm error Lifecycle script `start` failed with error:
npm error code 1
npm error path /opt/render/project/src/server
npm error workspace @freellmapi/server@0.2.1
npm error location /opt/render/project/src/server
npm error command failed
npm error command sh -c node dist/index.js
==> Running 'cd server && npm start'
> @freellmapi/server@0.2.1 start
> node dist/index.js
◇ injected env (0) from ../.env // tip: ⌁ auth for agents [www.vestauth.com]
(node:64) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.
To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'
See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
Database initialized using PostgreSQL
Server running on http://[::]:3001
Proxy endpoint: http://[::]:3001/v1/chat/completions
[Health] Starting health checker (every 300s)
[Health] Checking 3 keys...
[Health] Key 1 transport error: function datetime(unknown) does not exist
[Health] Check failed: error: function datetime(unknown) does not exist
    at /opt/render/project/src/node_modules/pg-pool/index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async PgStatement.run (file:///opt/render/project/src/server/dist/db/pg-wrapper.js:66:24)
    at async checkKeyHealth (file:///opt/render/project/src/server/dist/services/health.js:40:9)
    at async checkAllKeys (file:///opt/render/project/src/server/dist/services/health.js:50:9)
    at async file:///opt/render/project/src/server/dist/services/health.js:61:13 {
  length: 210,
  severity: 'ERROR',
  code: '42883',
  detail: undefined,
  hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
  position: '52',
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'parse_func.c',
  line: '629',
  routine: 'ParseFuncOrColumn'
}
[Error] function datetime(unknown, unknown) does not exist
/opt/render/project/src/node_modules/pg-pool/index.js:45
    Error.captureStackTrace(err)
          ^
error: function julianday(unknown) does not exist
    at /opt/render/project/src/node_modules/pg-pool/index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async PgStatement.all (file:///opt/render/project/src/server/dist/db/pg-wrapper.js:80:24)
    at async refreshStatsCache (file:///opt/render/project/src/server/dist/services/router.js:153:22) {
  length: 211,
  severity: 'ERROR',
  code: '42883',
  detail: undefined,
  hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
  position: '45',
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'parse_func.c',
  line: '629',
  routine: 'ParseFuncOrColumn'
}
Node.js v24.14.1
npm error Lifecycle script `start` failed with error:
npm error code 1
npm error path /opt/render/project/src/server
npm error workspace @freellmapi/server@0.2.1
npm error location /opt/render/project/src/server
npm error command failed
npm error command sh -c node dist/index.js
==> Running 'cd server && npm start'
> @freellmapi/server@0.2.1 start
> node dist/index.js
◇ injected env (0) from ../.env // tip: ◈ encrypted .env [www.dotenvx.com]
(node:64) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.
To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'
See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
Database initialized using PostgreSQL
Server running on http://[::]:3001
Proxy endpoint: http://[::]:3001/v1/chat/completions
[Health] Starting health checker (every 300s)
[Error] function datetime(unknown, unknown) does not exist
/opt/render/project/src/node_modules/pg-pool/index.js:45
    Error.captureStackTrace(err)
          ^
error: function julianday(unknown) does not exist
    at /opt/render/project/src/node_modules/pg-pool/index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async PgStatement.all (file:///opt/render/project/src/server/dist/db/pg-wrapper.js:80:24)
    at async refreshStatsCache (file:///opt/render/project/src/server/dist/services/router.js:153:22) {
  length: 211,
  severity: 'ERROR',
  code: '42883',
  detail: undefined,
  hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
  position: '45',
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'parse_func.c',
  line: '629',
  routine: 'ParseFuncOrColumn'
}
Node.js v24.14.1
npm error Lifecycle script `start` failed with error:
npm error code 1
npm error path /opt/render/project/src/server
npm error workspace @freellmapi/server@0.2.1
npm error location /opt/render/project/src/server
npm error command failed
npm error command sh -c node dist/index.js
==> Running 'cd server && npm start'
> @freellmapi/server@0.2.1 start
> node dist/index.js
◇ injected env (0) from ../.env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
(node:64) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.
To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'
See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
Database initialized using PostgreSQL
Server running on http://[::]:3001
Proxy endpoint: http://[::]:3001/v1/chat/completions
[Health] Starting health checker (every 300s)
/opt/render/project/src/node_modules/pg-pool/index.js:45
    Error.captureStackTrace(err)
          ^
error: function julianday(unknown) does not exist
    at /opt/render/project/src/node_modules/pg-pool/index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async PgStatement.all (file:///opt/render/project/src/server/dist/db/pg-wrapper.js:80:24)
    at async refreshStatsCache (file:///opt/render/project/src/server/dist/services/router.js:153:22) {
  length: 211,
  severity: 'ERROR',
  code: '42883',
  detail: undefined,
  hint: 'No function matches the given name and argument types. You might need to add explicit type casts.',
  position: '45',
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'parse_func.c',
  line: '629',
  routine: 'ParseFuncOrColumn'
}
Node.js v24.14.1
npm error Lifecycle script `start` failed with error:
npm error code 1
npm error path /opt/render/project/src/server
npm error workspace @freellmapi/server@0.2.1
npm error location /opt/render/project/src/server
npm error command failed
npm error command sh -c node dist/index.js