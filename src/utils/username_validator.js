const username_exists = function(username) {
  if (!username) {
    return 'Username cannot be empty'
  }
  return null
}

const username_length_min = function(username) {
  if (username.length < 3) {
    return 'Username should be atleast 3 characters long'
  }
  return null
}

const username_length_max = function(username) {
  if (username.length > 50) {
    return 'Username should not be greater than 50 characters'
  }
  return null
}

const username_char_valid = function(username) {
  if (username.match(/[^\w.-]/)) {
    return 'Invalid username'
  }
  return null
}

const username_first_char_valid = function(username) {
  if (username.match(/^[a-zA-Z].*/)) {
    return null
  }
  return "Username should start with alphabets only"
}

const username_last_char_valid = function(username) {
  if (username.match(/[^A-Za-z0-9]+$/)) {
    return 'Invalid username'
  }
  return null
}

const username_no_double_special = function(username) {
  if (username.match(/[-_.]{2,}/)) {
    return 'Invalid username'
  }
  return null
}

const username_does_not_end_with_confusing_suffix = function(username) {
  const confusing_extensions = CONFUSING_EXTENSIONS = /\.(js|ts|json|css|htm|html|xml|jpg|jpeg|png|gif|bmp|ico|tif|tiff|woff)$/
  if (username.match(confusing_extensions)) {
    return 'Username name cannot contain extensions'
  }
  return null
}

const validateUsername = function(username) {
  validators = [
    username_exists,
    username_length_min,
    username_length_max,
    username_char_valid,
    username_first_char_valid,
    username_last_char_valid,
    username_no_double_special,
    username_does_not_end_with_confusing_suffix
  ]
  return validators.reduce((err, validator) => {
    if (err) return err
    return validator(username)
  }, null)
}

module.exports = {
  validateUsername
}
