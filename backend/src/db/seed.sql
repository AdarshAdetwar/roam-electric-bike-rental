INSERT INTO scooters (name, category, location_text, battery_percentage, hourly_rate, status)
VALUES
  ('Roam City 01', 'City', 'Union Square, San Francisco', 94, 8.50, 'available'),
  ('Roam City 02', 'City', 'Market Street, San Francisco', 18, 7.00, 'low-battery'),
  ('Roam Pro 03', 'Pro', 'Embarcadero Station, San Francisco', 78, 12.00, 'available'),
  ('Roam Cargo 04', 'Cargo', 'Ferry Building, San Francisco', 62, 15.50, 'available')
ON CONFLICT (name) DO NOTHING;
