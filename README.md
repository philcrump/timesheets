# timesheets

## Database Setup

### Ubuntu PostgreSQL Repository

```
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/postgres.list
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
```

`sudo apt-get install postgres-12`

Scripts in *sql/*

`sudo -u postgres psql -U postgres -f - < sql/<script>.sql`

**init_database.sql**
 * _Example_ database setup script - please modify before use.

## Authors

Phil Crump <phil@philcrump.co.uk>