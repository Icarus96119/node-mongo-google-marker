import mongoose from 'mongoose';

const { Schema } = mongoose;

const locationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  telephone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  }
});

// Write some code for encrypting password here ...

const Location = mongoose.model('Location', locationSchema);

export default Location;

console.log('Executing Server: location.js ...');
