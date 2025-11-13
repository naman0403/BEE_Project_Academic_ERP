const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 

  },
  marks: { 
    type: Number, 
    required: true 

  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 

  }, 
  date: { 
    type: Date, 
    default: Date.now 

  }
}, { timestamps: true });

module.exports = mongoose.model('Marks', marksSchema);
