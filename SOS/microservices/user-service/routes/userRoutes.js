const express = require('express');
const router = express.Router();
const {registerUser,deleteUser,updateUser} = require('../controller/userController');

router.post('/register-user', registerUser);
router.delete('/delete-user/:id', deleteUser);
router.put('/update-user/:id', updateUser);

module.exports = router;