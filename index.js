#!/usr/bin/env node

'use strict';

/* Retrieve configuration from 'config.json' file */
var config = null;
try {
  config = require('./config.json');
}
catch(err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.log('config.json not found! Please use the template to create a configuration file.');
    process.exit(1);
  }
  throw err;
}

/* Securely random bytes */
const crypto = require("crypto");

/* Password hashing and verification */
const passwordCrypt = require('./passwordCrypt.js');

/* Email to users (register & forgotten password) */
const email = require('./email.js');

/* Import express http server requirements */
const express = require('express');

/* Postgres for database */
const pg = require('pg');
/* Postgres-backed express sessions */
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

/* Express post-request handling */
const bodyParser = require('body-parser');
 

var pgPool = new pg.Pool({
  host: config["postgres-host"],
  user: config["postgres-user"],
  database: config["postgres-database"],
  max: 20,
  idleTimeoutMillis: 60*1000,
  connectionTimeoutMillis: 2*1000,
});

const app = express();

app.disable('x-powered-by')
app.use(express.static('htdocs'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
app.use(session({
  store: new pgSession({
    pool : pgPool,                // Connection pool
    tableName : 'sessions'   // Use another table-name than the default "session" one
  }),
  secret: config["cookie-secret"],
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

app.post('/api/v1/register', (request, response) => {
  const request_name = request.body.name;
  const request_email = request.body.email;
  const request_password = request.body.password;

  if(!request_email.endsWith(config["email-domain"]))
  {
    response.status(403).json({"error": "Email domain not valid."});
    return;
  }

  passwordCrypt.cryptPassword(request_password, (error, password_hash) => {
    if(error) {
      response.status(500).json({"error": "Server Error"});
      throw error;
      return;
    }

    pgPool.query('SELECT id FROM users WHERE email=$1;', [request_email], (error, results) => {
      if (error) {
        response.status(500).json({"error": "Server Error"});
        throw error;
        return;
      }
      if(results.rows.length > 0)
      {
        response.status(500).json({"error": "User already exists"});
        return;
      }

      pgPool.query('INSERT INTO users (name, email, password) VALUES ($1, $2);', [request_name, request_email, password_hash], (error, results) => {
        if (error) {
          response.status(500).json({"error": "Server Error"});
          throw error;
          return;
        }
        response.status(200).end();
        email.sendRegisterEmail(request_email, config);
      });
    });
  });
});

app.post('/api/v1/login', (request, response) => {
  const request_email = request.body.email;
  const request_password = request.body.password;

  pgPool.query('SELECT id, type, password FROM users WHERE email=$1 LIMIT 1;', [request_email], (error, results) => {
    if (error) {
      response.status(500).end();
      throw error;
      return;
    }
    if(results.rows.length == 1)
    {
      var row = results.rows[0];
      passwordCrypt.comparePassword(request_password, row.password, (error, result) => {
        if (error) {
          response.status(500).end();
          throw error;
          return;
        }
        if(result == true) {
          /* Password matches, set up session information */
          request.session.user_id = row.id;
          request.session.user_type = row.type;
          request.session.logged_in = true;

          response.status(200).end();
        }
        else {
          response.status(403).end();
        }
      });
    }
    else {
      response.status(403).end();
    }
  });
});

app.post('/api/v1/logout', (request, response) => {
  request.session.logged_in = false;
  request.session.user_id = null;
  request.session.user_type = null;
  response.status(200).end();
});

app.post('/api/v1/reset_request', (request, response) => {
  const request_email = request.body.email;

  var reset_key = crypto.randomBytes(32).toString('base64');

  pgPool.query('UPDATE users SET reset_key=$1 WHERE email=$2;', [reset_key, request_email], (error, results) => {
    if (error) {
      response.status(500).end();
      throw error;
      return;
    }
    email.sendPasswordResetEmail(request_email, reset_key, config);
    response.status(200).end();
  });
});

app.post('/api/v1/reset_password', (request, response) => {
  const request_password = request.body.password;
  const request_resetKey = request.body.resetKey;

  passwordCrypt.cryptPassword(request_password, (error, password_hash) => {
    if(error) {
      response.status(500).json({"error": "Server Error"});
      throw error;
      return;
    }

    pgPool.query('UPDATE users SET password = $1, reset_key = NULL WHERE reset_key=$2;', [password_hash, request_resetKey], (error, results) => {
      if (error) {
        response.status(500).end();
        throw error;
        return;
      }
      response.status(200).end();
    });
  });
});

app.get('/api/v1/admin_users', (request, response) => {
  /* Check they're logged in */
  if(request.session.logged_in && request.session.user_type == 'admin') {
    pgPool.query('SELECT id, email, type FROM users;', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows);
    });
  } else {
    response.status(403).end();
  }
});

app.get('/api/v1/user_projects', (request, response) => {
  /* Check they're logged in */
  if(request.session.logged_in) {
    pgPool.query('WITH RECURSIVE user_projects AS ( \
                    SELECT \
                      projects.id AS id, projects.name AS name, \
                      projects.parent_id AS parent_id, \
                      CASE WHEN P3.id IS NULL THEN false \
                        ELSE true \
                        END AS has_children \
                    FROM projects \
                    LEFT OUTER JOIN projects as P3 \
                      ON P3.parent_id = projects.id \
                    INNER JOIN users_projects \
                      ON projects.id = users_projects.project_id \
                    WHERE users_projects.user_id = $1 \
                  UNION \
                    SELECT \
                      P2.id AS id, P2.name AS name, P2.parent_id AS parent_id, \
                      CASE WHEN P4.id IS NULL THEN false  \
                        ELSE true \
                        END AS has_children \
                    FROM projects AS P2 \
                    LEFT OUTER JOIN projects as P4 \
                      ON P4.parent_id = P2.id \
                    INNER JOIN user_projects \
                      ON P2.parent_id = user_projects.id \
                ) SELECT * FROM user_projects;', [request.session.user_id], (error, results) => {
      if (error) {
        throw error;
      }
      var output_object = {};
      for (const row of results.rows)
      {
        if(row.parent_id == null)
        {
          output_object[row.id] = row;
          if(row.has_children == true)
          {
            output_object[row.id].children = {};
          }
        }
        else
        {
          /* Find parent */
          if(output_object.hasOwnProperty(row.parent_id))
          {
            /* Found at top level */
            output_object[row.parent_id].children[row.id] = row;
            if(row.has_children == true)
            {
              output_object[row.parent_id].children[row.id].children = {};
            }
          }
          else
          {
            /* Need to search children */
            Object.keys(output_object).forEach(function(grandparent_key)
            {
              const grandparent = output_object[grandparent_key];
              if(grandparent.has_children && grandparent.children.hasOwnProperty(row.parent_id))
              {
                /* Found at second level */
                output_object[grandparent_key].children[row.parent_id].children[row.id] = row;
                if(row.has_children == true)
                {
                  output_object[grandparent_key].children[row.parent_id].children[row.id].children = {};
                  console.log("Need better recursion on project structure construction!");
                }
              }
            });
          }
        }
      }

      response.status(200).json(output_object);
    });
  } else {
    response.status(403).end();
  }
});

app.get('/api/v1/user_times', (request, response) => {
  if(request.session.logged_in)
  {
    if(request.query.hasOwnProperty('weekdate') && request.query.weekdate != "")
    {
      const monday_date = request.query.weekdate;
      pgPool.query('SELECT "date", TO_CHAR("date", \'day\') AS day, project_id, EXTRACT(epoch FROM duration) as duration FROM times WHERE user_id = $1 AND "date" >= TO_DATE($2, \'YYYY-MM-DD\') AND "date" < TO_DATE($3, \'YYYY-MM-DD\') + INTERVAL \'7 day\';', [request.session.user_id, monday_date, monday_date], (error, results) => {
        if (error) {
          response.status(500).end();
          throw error
        }
        response.status(200).json(results.rows);
      });
    }
    else
    {
      response.status(400).end();
    }
  } else {
    response.status(403).end();
  }
});

function pg_user_times_placeholders(rowCount, columnCount)
{
  var index = 1;
  return Array(rowCount).fill(0).map(v => `(${Array(columnCount).fill(0).map(v => `$${index++}`).join(", ")})`).join(", ");
}

function pg_user_times_flatten(post_object, _user_id)
{
  var newArr = [];
  /* Target format: "[user_id, date, project_id, duration" */
  Object.keys(post_object).forEach(function(post_object_key)
  {
    newArr.push(_user_id);
    newArr.push(post_object[post_object_key].date);
    newArr.push(post_object[post_object_key].project_id);
    newArr.push(post_object[post_object_key].duration);
  });
  return newArr;
}

app.post('/api/v1/user_times', (request, response) => {
  if(request.session.logged_in) {
    const new_user_times = request.body;
    pgPool.query(
      `INSERT INTO times (user_id, date, project_id, duration) VALUES ${pg_user_times_placeholders(new_user_times.length, 4)} \
      ON CONFLICT (date, user_id, project_id) DO UPDATE SET duration=EXCLUDED.duration;`,
      pg_user_times_flatten(new_user_times, request.session.user_id),
      (error, results) => {
        if (error) {
          response.status(500).end();
          throw error;
        }
        response.status(200).json(results.rows);
      }
    );
  } else {
    response.status(403).end();
  }
});

app.listen(8000, () => {
  console.log('timesheets app listening on port 8000');
});

app.get('/api/v1/manager_projects', (request, response) => {
  /* Check they're logged in */
  if(request.session.logged_in && request.session.user_type == 'manager') {
    pgPool.query('SELECT id, email, type FROM users;', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows);
    });
  } else {
    response.status(403).end();
  }
});