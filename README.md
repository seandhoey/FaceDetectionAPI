# FaceDetectionAPI
Server hosted on Render for free. This can be very slow when first accessed.

Uses environmental variables on Render to access sensitive data such as Clarifai API config, and PostgreSQL connection config. Hashes passwords into the database.

Since this is a personal project, I am purposely using a deprecated package (bcrypt-nodejs) for simplicity. All API calls are also logged (including passwords) since they have no real value on this website. 

Thank you for checking out my project.
