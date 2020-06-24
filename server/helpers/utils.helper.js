/**
 * Origin Plateform JS helpers
 */
import {
  Options
} from '../models';
import fs  from 'fs';
import path from 'path';
import urlJoin from 'url-join';
import config from '../config';

const utilsHelpers = {
  options: {},

  // Add the public URL to an Endpoint
  async getOption(name) {
    // Validate input
    if (typeof name != 'string' || name == "") {
      return false;
    }

    if (this.options[name] != null) {
      return this.options[name];
    }

    // Get the option
    const option = await Options.findOne({
      where: {
        'name': name
      }
    });

    // Check if option exists
    if (!option) {
      return false;
    }

    this.options[name] = option.value; // Store it into the object
    return this.options[name];
  },

  // Upload a file
  async uploadFile(data) {
    // Get the vars
    let {
      destination,
      file,
      allowedFileMime,
      savedFileName
    } = data;
    
    // Set the destination
    if (destination == null || destination == undefined || destination == '') {
      destination = config.folders.upload_misc;
    }
    const uploadFolder = path.join(
      __dirname,
       '../../', // Get back to the root of the server folder
       destination);
    
    // Verify if the user folder exists
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder); // Creat the folder
    }

    // Get the file vars
    const {
      mimetype,
      createReadStream,
    } = await file;
    
    // Set the default allowed file mime
    if (typeof allowedFileMime != 'object' || allowedFileMime.length < 1) {
      allowedFileMime = ['image/jpeg', 'image/jpg', 'image/png']; // TODO make an option in DB
    }

    // Validate file metadata
    if (allowedFileMime.indexOf(mimetype) < 0) {
      return false;
    }

    // Prepare the destination
    if ([undefined, null, ''].indexOf(savedFileName) > -1) {
      const today = new Date();
      const mimeType_temp = mimetype.split('/');
      savedFileName = '' + today.getFullYear() + ("0" + (today.getMonth() + 1)).slice(-2) + today.getDate() + '-' + today.getTime() + '.' + mimeType_temp[1];
    }
    
    // Save the file
    return await new Promise((resolve, reject) => {
      createReadStream()
      .pipe(fs.createWriteStream(path.join(uploadFolder, savedFileName)))
      .on("close", function() {
        resolve(savedFileName);
      })
      .on("error", function (err) {
        reject(false);
      })
    });
  },

  async clearOptionsCache() {
    this.options = {}
    return true;
  },

  async fromUrl(url) {
    return urlJoin(config.urls.frontend_url, url);
  },
  
  /**
   * Render file URL
   * Get the file name of .jpg file and verify it's existance
   * The file will return a null if the file is not existing of the server public folder
   * @param String fileName file name with no URL (ex: 20190830-1567181256802-87.jpeg)
   */
  async renderFilePublicUrl(fileName, path) {
    if (fileName.indexOf('http://') >= 0 || fileName.indexOf('https://') >= 0) {
      return fileName;
    }
    if (path == null || path == undefined) {
      path = config.folders.upload_misc;
    }
    return await this.fileExists(fileName, path)
      .then(function(){
        return urlJoin(config.urls.server_url, path, fileName);
      })
      .catch(function(){
        return null;
      });
  },
  
  /**
   * renderProfilePictureUrl
   * Get the file name of .jpg file and verify it's existance
   * The file will return a null if the file is not existing of the server public folder
   * @param String fileName file name with no URL (ex: 20190830-1567181256802-87.jpeg)
   */
  async renderProfilePictureUrl(fileName) {
    return await this.fileExists(fileName, config.folders.upload_user)
      .then(function(result){
        return urlJoin(config.urls.server_url, config.folders.upload_user, fileName);
      })
      .catch(function(error){
        return null;
      });
  },

  async fileExists(fileName, fileFolder) {
    if (fileFolder == undefined) {
      fileFolder = config.folders.upload_misc;
    }
    const filePath = path.join(
      __dirname,
      '../../', // Get back to the root of the server folder
      fileFolder,
      fileName
    );
    return new Promise((resolve, reject) => {
      fs.access(filePath, fs.F_OK, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      })
    });
  }
}
module.exports = utilsHelpers;