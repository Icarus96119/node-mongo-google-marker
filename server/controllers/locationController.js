import db from './../models'
// Could be import db from './../models/index' but index.js is the default JS file i a folder

const locationController = {};
// Empty object

// Post = Create
locationController.post = (req, res) => {
  const { name, latitude, longitude, telephone, address } = req.body;
  console.log('API location "post" request');

  console.log('here', name);req

  const location = new db.Location({
    name,
    latitude,
    longitude,
    telephone,
    address
  });

  location.save().then((newLocation) => {
    res.status(200).json({
      success: true,
      data: newLocation,
    });
  }).catch((err) => {
    res.status(500).json({
      message: err,
    });
    console.log(err);
  });
};

locationController.get = (req, res) => {
  console.log('API get accessed');
  db.Location.find({}).then((locations) => {
    return res.status(200).json({
      success: true,
      data: locations
    });
  }).catch((err) => {
    return res.status(500).json({
      message: err
    });
  });
  console.log('API post "Get all posts" request');
};

export default locationController;

console.log('Executing Controller: locationController.js ...');
