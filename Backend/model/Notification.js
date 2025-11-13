const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  toUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['attendance','notice'], 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  meta: { 
    type: mongoose.Schema.Types.Mixed 

  }, 
  read: { 
    type: Boolean, 
    default: false 

  },
  createdAt: { 
    type: Date, 
    default: Date.now 

  }
});

module.exports = mongoose.model('Notification', notificationSchema);
