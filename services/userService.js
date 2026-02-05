// services/userService.js - Production-optimized
import apiClient from './apiClient';

class UserService {
  async getProfile() {
    return await apiClient.get('/users/profile');
  }

  async updateProfile(data) {
    return await apiClient.put('/users/profile', data);
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return await apiClient.put('/users/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  async uploadProfilePicture(imageUri) {
    const formData = new FormData();
    formData.append('profilePicture', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });

    return await apiClient.post('/users/profile-picture', formData);
  }

  async getUserStats() {
    return await apiClient.get('/users/stats');
  }
}

export default new UserService();