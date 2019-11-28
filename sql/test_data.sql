\c "timesheets";

INSERT INTO users 
  (id, name, email, password, type)
  VALUES 
  (
    1,
    'Test Data',
    'test@example.com',
    '$2b$10$YZ8Y./dGtw1sr/FHjX.YJOXuE66kCvgxULoceM0mrCq.9HQI8aeLG', /* "test" */
    'manager'
  );

INSERT INTO projects 
  (id, parent_id, name)
  VALUES 
  (  1, NULL, 'X' ),
  (  2,  1, 'X-A'),
  (  3,  2, 'X-A-1'),
  (  4,  2, 'X-A-2'),
  (  5,  2, 'X-A-3'),
  (  6,  2, 'X-A-4'),
  (  7,  1, 'X-B'),
  (  8,  7, 'X-B-1'),
  (  9,  7, 'X-B-2'),
  ( 10,  7, 'X-B-3'),
  ( 11, NULL, 'Y');

INSERT INTO users_projects 
  (user_id, project_id, hourly_rate)
  VALUES 
  ( 1, 1, 123.56 ),
  ( 1, 11, 1.0 );
