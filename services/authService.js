// services/authService.js - Production-optimized
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const DEBUG = __DEV__;

class AuthService {
  constructor() {
    this.registrationData = {
      step1: null,
      step2: null,
      step3: null,
      password: null,
    };
  }

  async uploadImages(imageDataArray) {
    try {
      if (DEBUG) {
        console.log('[AUTH] Uploading images:', imageDataArray.length);
      }
      
      if (!imageDataArray || imageDataArray.length === 0) {
        return {};
      }

      const formData = new FormData();
      
      imageDataArray.forEach(item => {
        if (item.uri) {
          const filename = item.uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append(item.fieldName, {
            uri: item.uri,
            name: filename,
            type: type,
          });
        }
      });

      const response = await apiClient.post('/auth/register/images', formData);

      if (response.success && response.data?.images) {
        if (DEBUG) console.log('[AUTH] Upload successful');
        return response.data.images;
      } else {
        throw new Error('Upload failed - no image data returned');
      }
      
    } catch (error) {
      console.error('[AUTH] Upload error:', error.message);
      
      let errorMessage = 'Image upload failed. ';
      
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('too large')) {
        errorMessage += 'One or more images are too large. Please use smaller images.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async saveStep1(data) {
    try {
      if (!data.fullName?.trim()) throw new Error('Full name is required');
      if (!data.phoneNumber?.trim()) throw new Error('Phone number is required');
      if (!data.email?.trim()) throw new Error('Email is required');

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }

      const phoneRegex = /^03[0-9]{2}-?[0-9]{7}$/;
      if (!phoneRegex.test(data.phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const cleanData = {
        fullName: data.fullName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        email: data.email.trim().toLowerCase(),
      };

      this.registrationData.step1 = cleanData;
      await AsyncStorage.setItem('registrationStep1', JSON.stringify(cleanData));
      
      if (DEBUG) console.log('[AUTH] Step 1 saved');
      return { success: true };
    } catch (error) {
      console.error('[AUTH] Step 1 error:', error.message);
      throw error;
    }
  }

  async saveStep2(data, onProgress) {
    try {
      if (!data.cnicNumber?.trim()) throw new Error('CNIC number is required');
      if (!data.houseNumber?.trim()) throw new Error('House number is required');
      if (!data.ownershipStatus) throw new Error('Ownership status is required');
      if (!data.profilePicUri) throw new Error('Profile picture is required');

      const cnicRegex = /^[0-9]{5}-?[0-9]{7}-?[0-9]$/;
      if (!cnicRegex.test(data.cnicNumber)) {
        throw new Error('Invalid CNIC format. Use: 12345-1234567-1');
      }

      if (onProgress) onProgress('Uploading images...');
      
      const imagesToUpload = [
        { fieldName: 'profilePicture', uri: data.profilePicUri }
      ];
      
      if (data.cnicFrontUri) {
        imagesToUpload.push({ fieldName: 'cnicFront', uri: data.cnicFrontUri });
      }
      
      if (data.cnicBackUri) {
        imagesToUpload.push({ fieldName: 'cnicBack', uri: data.cnicBackUri });
      }

      const uploadedImages = await this.uploadImages(imagesToUpload);
      
      if (!uploadedImages.profilePicture) {
        throw new Error('Profile picture upload failed');
      }

      const cleanData = {
        cnicNumber: data.cnicNumber.trim(),
        houseNumber: data.houseNumber.trim(),
        ownershipStatus: data.ownershipStatus,
        profilePicture: uploadedImages.profilePicture,
        cnicFront: uploadedImages.cnicFront || null,
        cnicBack: uploadedImages.cnicBack || null,
      };

      this.registrationData.step2 = cleanData;
      await AsyncStorage.setItem('registrationStep2', JSON.stringify(cleanData));
      
      if (DEBUG) console.log('[AUTH] Step 2 saved');
      return { success: true, uploadedImages };
    } catch (error) {
      console.error('[AUTH] Step 2 error:', error.message);
      throw error;
    }
  }

  async saveStep3(vehicles, onProgress) {
    try {
      if (!vehicles || vehicles.length === 0) {
        this.registrationData.step3 = [];
        await AsyncStorage.setItem('registrationStep3', JSON.stringify([]));
        if (DEBUG) console.log('[AUTH] Step 3 saved (no vehicles)');
        return { success: true };
      }

      for (const v of vehicles) {
        if (!v.plateNumber?.trim()) throw new Error('Plate number is required');
        if (!v.make?.trim()) throw new Error('Vehicle make is required');
        if (!v.model?.trim()) throw new Error('Vehicle model is required');
        if (!v.color?.trim()) throw new Error('Vehicle color is required');
        if (!v.registrationImageUri) throw new Error('Registration image is required');
        if (!v.vehicleImageUri) throw new Error('Vehicle photo is required');
      }

      if (onProgress) onProgress('Uploading vehicle images...');
      
      const imagesToUpload = [];
      
      vehicles.forEach((v, index) => {
        imagesToUpload.push({
          fieldName: `vehicle_${index}_registration`,
          uri: v.registrationImageUri,
        });
        imagesToUpload.push({
          fieldName: `vehicle_${index}_photo`,
          uri: v.vehicleImageUri,
        });
      });

      const uploadedImages = await this.uploadImages(imagesToUpload);

      const processedVehicles = vehicles.map((v, index) => {
        const regKey = `vehicle_${index}_registration`;
        const photoKey = `vehicle_${index}_photo`;
        
        return {
          type: v.type,
          plateNumber: v.plateNumber.trim().toUpperCase(),
          make: v.make.trim(),
          model: v.model.trim(),
          color: v.color.trim(),
          registrationImage: uploadedImages[regKey],
          vehicleImage: uploadedImages[photoKey],
        };
      });

      this.registrationData.step3 = processedVehicles;
      await AsyncStorage.setItem('registrationStep3', JSON.stringify(processedVehicles));
      
      if (DEBUG) console.log('[AUTH] Step 3 saved');
      return { success: true, uploadedImages };
    } catch (error) {
      console.error('[AUTH] Step 3 error:', error.message);
      throw error;
    }
  }

  async completeRegistration(onProgress) {
    try {
      if (onProgress) onProgress('Preparing registration data...');
      
      const step1 = this.registrationData.step1 || 
                    JSON.parse(await AsyncStorage.getItem('registrationStep1') || 'null');
      const step2 = this.registrationData.step2 || 
                    JSON.parse(await AsyncStorage.getItem('registrationStep2') || 'null');
      const step3 = this.registrationData.step3 || 
                    JSON.parse(await AsyncStorage.getItem('registrationStep3') || '[]');
      const password = this.registrationData.password || 
                       await AsyncStorage.getItem('registrationPassword');

      if (!step1) throw new Error('Personal information missing. Please restart registration.');
      if (!step2) throw new Error('Property information missing. Please restart registration.');
      if (!password) throw new Error('Password missing. Please restart registration.');

      const payload = {
        fullName: step1.fullName,
        phoneNumber: step1.phoneNumber,
        email: step1.email,
        cnicNumber: step2.cnicNumber,
        houseNumber: step2.houseNumber,
        ownershipStatus: step2.ownershipStatus,
        profilePicture: step2.profilePicture,
        cnicFront: step2.cnicFront,
        cnicBack: step2.cnicBack,
        vehicles: step3,
        password,
      };

      if (onProgress) onProgress('Submitting registration...');
      
      const response = await apiClient.post('/auth/register/complete', payload);

      if (DEBUG) console.log('[AUTH] Registration successful');

      await this.clearRegistrationData();

      return {
        success: true,
        message: response.message || 'Registration completed successfully',
        requiresApproval: response.data?.requiresApproval !== false,
      };

    } catch (error) {
      console.error('[AUTH] Registration failed:', error.message);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        errorMessage = 'Cannot connect to server.\n\nPlease check your internet connection and try again.';
      } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async login(cnicNumber, password) {
    try {
      if (!cnicNumber?.trim()) throw new Error('CNIC number is required');
      if (!password?.trim()) throw new Error('Password is required');

      const response = await apiClient.post('/auth/login', {
        cnicNumber: cnicNumber.trim(),
        password,
      });

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        if (DEBUG) console.log('[AUTH] Login successful');
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('[AUTH] Login error:', error.message);
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    }
  }

  async logout() {
    try {
      try {
        await apiClient.post('/auth/logout');
      } catch (err) {
        if (DEBUG) console.log('[AUTH] Logout API call failed:', err.message);
      }
      
      await AsyncStorage.multiRemove(['token', 'user']);
      if (DEBUG) console.log('[AUTH] Logout successful');
      
    } catch (error) {
      console.error('[AUTH] Logout error:', error.message);
      await AsyncStorage.multiRemove(['token', 'user']);
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      
      if (response.success && response.data) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      
      throw new Error('Failed to get user data');
    } catch (error) {
      console.error('[AUTH] Get user error:', error.message);
      throw error;
    }
  }

  async clearRegistrationData() {
    try {
      this.registrationData = {
        step1: null,
        step2: null,
        step3: null,
        password: null,
      };
      
      await AsyncStorage.multiRemove([
        'registrationStep1',
        'registrationStep2',
        'registrationStep3',
        'registrationPassword',
      ]);
      
      if (DEBUG) console.log('[AUTH] Registration data cleared');
    } catch (error) {
      console.error('[AUTH] Clear data error:', error.message);
    }
  }

  async isLoggedIn() {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();