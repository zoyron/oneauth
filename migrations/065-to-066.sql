UPDATE users
SET mobile_number = CONCAT('+91-', mobile_number)
WHERE LENGTH(mobile_number) = 10
