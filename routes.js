const express = require('express'); //import express

// 1.
const router  = express.Router(); 
// 2.
const controller = require('./controllers'); 
// 3.
router.get('/tea', controller.newTea); 
// 4. 
module.exports = router; // export to use in server.js