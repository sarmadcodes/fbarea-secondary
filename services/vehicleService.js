// services/vehicleService.js - Production-optimized
import apiClient from './apiClient';

const DEBUG = __DEV__;

class VehicleService {
  async getVehicles() {
    try {
      return await apiClient.get('/vehicles');
    } catch (error) {
      console.error('[VehicleService] Error getting vehicles:', error.message);
      throw error;
    }
  }

  async getVehicle(id) {
    try {
      return await apiClient.get(`/vehicles/${id}`);
    } catch (error) {
      console.error('[VehicleService] Error getting vehicle:', error.message);
      throw error;
    }
  }

  async getUserChangeRequests(status = 'pending') {
    try {
      const params = status && status !== 'all' ? { status } : {};
      const response = await apiClient.get('/vehicles/change-requests', params);
      return response;
    } catch (error) {
      console.error('[VehicleService] Error getting change requests:', error.message);
      return { data: [], success: true };
    }
  }

  async getAllChangeRequests() {
    try {
      return await apiClient.get('/vehicles/change-requests', { status: 'all' });
    } catch (error) {
      console.error('[VehicleService] Error getting all change requests:', error.message);
      return { data: [], success: true };
    }
  }

  async addVehicle(vehicleData, images) {
    try {
      if (!vehicleData.type) throw new Error('Vehicle type is required');
      if (!vehicleData.plateNumber) throw new Error('Plate number is required');
      if (!vehicleData.make) throw new Error('Make is required');
      if (!vehicleData.model) throw new Error('Model is required');
      if (!vehicleData.color) throw new Error('Color is required');

      const formData = new FormData();
      
      formData.append('type', vehicleData.type);
      formData.append('plateNumber', vehicleData.plateNumber.toUpperCase());
      formData.append('make', vehicleData.make);
      formData.append('model', vehicleData.model);
      formData.append('color', vehicleData.color);

      if (images?.registrationImage) {
        const regImageUri = images.registrationImage?.url || images.registrationImage;
        
        if (regImageUri && !this.isCloudinaryUrl(regImageUri)) {
          const imageFile = this.createImageFile(regImageUri, 'registration');
          if (imageFile) {
            formData.append('registrationImage', imageFile);
          }
        }
      }

      if (images?.vehicleImage) {
        const vehImageUri = images.vehicleImage?.url || images.vehicleImage;
        
        if (vehImageUri && !this.isCloudinaryUrl(vehImageUri)) {
          const imageFile = this.createImageFile(vehImageUri, 'vehicle');
          if (imageFile) {
            formData.append('vehicleImage', imageFile);
          }
        }
      }

      const response = await apiClient.post('/vehicles', formData);
      
      if (DEBUG) console.log('[VehicleService] Vehicle added');
      return response;
    } catch (error) {
      console.error('[VehicleService] Error adding vehicle:', error.message);
      
      if (error.message.includes('already exists')) {
        throw new Error('This vehicle is already registered');
      } else if (error.message.includes('pending request')) {
        throw new Error('You already have a pending request for this vehicle');
      } else if (error.message.includes('Network')) {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to add vehicle. Please try again.');
    }
  }

  async updateVehicle(id, vehicleData, images) {
    try {
      const formData = new FormData();
      
      if (vehicleData.type) formData.append('type', vehicleData.type);
      if (vehicleData.plateNumber) formData.append('plateNumber', vehicleData.plateNumber.toUpperCase());
      if (vehicleData.make) formData.append('make', vehicleData.make);
      if (vehicleData.model) formData.append('model', vehicleData.model);
      if (vehicleData.color) formData.append('color', vehicleData.color);

      if (images?.registrationImage) {
        const regImageUri = images.registrationImage?.url || images.registrationImage;
        
        if (regImageUri && !this.isCloudinaryUrl(regImageUri)) {
          const imageFile = this.createImageFile(regImageUri, 'registration');
          if (imageFile) {
            formData.append('registrationImage', imageFile);
          }
        }
      }

      if (images?.vehicleImage) {
        const vehImageUri = images.vehicleImage?.url || images.vehicleImage;
        
        if (vehImageUri && !this.isCloudinaryUrl(vehImageUri)) {
          const imageFile = this.createImageFile(vehImageUri, 'vehicle');
          if (imageFile) {
            formData.append('vehicleImage', imageFile);
          }
        }
      }

      const response = await apiClient.put(`/vehicles/${id}`, formData);
      
      if (DEBUG) console.log('[VehicleService] Vehicle updated');
      return response;
    } catch (error) {
      console.error('[VehicleService] Error updating vehicle:', error.message);
      
      if (error.message.includes('not found')) {
        throw new Error('Vehicle not found');
      } else if (error.message.includes('not authorized')) {
        throw new Error('You are not authorized to update this vehicle');
      } else if (error.message.includes('pending request')) {
        throw new Error('You already have a pending update request for this vehicle');
      } else if (error.message.includes('Network')) {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to update vehicle. Please try again.');
    }
  }

  async deleteVehicle(id) {
    try {
      const response = await apiClient.delete(`/vehicles/${id}`);
      if (DEBUG) console.log('[VehicleService] Vehicle deleted');
      return response;
    } catch (error) {
      console.error('[VehicleService] Error deleting vehicle:', error.message);
      
      if (error.message.includes('not found')) {
        throw new Error('Vehicle not found');
      } else if (error.message.includes('not authorized')) {
        throw new Error('You are not authorized to delete this vehicle');
      } else if (error.message.includes('pending request')) {
        throw new Error('You already have a pending delete request for this vehicle');
      } else if (error.message.includes('Network')) {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to delete vehicle. Please try again.');
    }
  }

  isCloudinaryUrl(url) {
    if (!url) return false;
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  }

  createImageFile(uri, type) {
    if (!uri) return null;

    try {
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const timestamp = Date.now();
      
      return {
        uri: uri,
        type: `image/${fileType}`,
        name: `${type}_${timestamp}.${fileType}`,
      };
    } catch (error) {
      console.error('[VehicleService] Error creating image file:', error.message);
      return null;
    }
  }
}

export default new VehicleService();