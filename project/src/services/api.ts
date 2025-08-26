const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('accessToken');
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request
            return this.request(endpoint, options);
          }
        }
        
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        return true;
      }

      // Refresh failed, clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return false;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getUserStats(period: string = 'week') {
    return this.request(`/users/stats?period=${period}`);
  }

  async getUserHistory(page: number = 1, limit: number = 20) {
    return this.request(`/users/history?page=${page}&limit=${limit}`);
  }

  async getUserAchievements() {
    return this.request('/users/achievements');
  }

  // Study session endpoints
  async startSession(sessionData: { subject?: string; task?: string; duration: number }) {
    return this.request('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async completeSession(sessionId: string, endTime?: string, completed: boolean = true) {
    return this.request('/sessions/complete', {
      method: 'PUT',
      body: JSON.stringify({ sessionId, endTime, completed }),
    });
  }

  async getSessionHistory(page: number = 1, limit: number = 20, subject?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(subject && { subject }),
    });
    return this.request(`/sessions/history?${params}`);
  }

  async getSessionAnalytics(period: string = 'week') {
    return this.request(`/sessions/analytics?period=${period}`);
  }

  async getActiveSession() {
    return this.request('/sessions/active');
  }

  // Campus and university endpoints
  async getUniversities(page: number = 1, limit: number = 20, country?: string, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(country && { country }),
      ...(search && { search }),
    });
    return this.request(`/campuses/universities?${params}`);
  }

  async getUniversity(id: string) {
    return this.request(`/campuses/universities/${id}`);
  }

  async createUniversity(universityData: any) {
    return this.request('/campuses/universities', {
      method: 'POST',
      body: JSON.stringify(universityData),
    });
  }

  async getCampuses(page: number = 1, limit: number = 20, universityId?: string, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(universityId && { universityId }),
      ...(search && { search }),
    });
    return this.request(`/campuses/campuses?${params}`);
  }

  async getCampus(id: string) {
    return this.request(`/campuses/campuses/${id}`);
  }

  async createCampus(campusData: any) {
    return this.request('/campuses/campuses', {
      method: 'POST',
      body: JSON.stringify(campusData),
    });
  }

  async getCampusActivity(campusId: string) {
    return this.request(`/campuses/campuses/${campusId}/activity`);
  }

  async getCampusLeaderboard(campusId: string, period: string = 'week', limit: number = 20) {
    const params = new URLSearchParams({
      period,
      limit: limit.toString(),
    });
    return this.request(`/campuses/campuses/${campusId}/leaderboard?${params}`);
  }

  // Leaderboard endpoints
  async getGlobalLeaderboard(period: string = 'all', limit: number = 50, page: number = 1) {
    const params = new URLSearchParams({
      period,
      limit: limit.toString(),
      page: page.toString(),
    });
    return this.request(`/leaderboards/global?${params}`);
  }

  async getUniversityLeaderboard(universityId: string, period: string = 'week', limit: number = 20, page: number = 1) {
    const params = new URLSearchParams({
      period,
      limit: limit.toString(),
      page: page.toString(),
    });
    return this.request(`/leaderboards/university/${universityId}?${params}`);
  }

  async getFriendsLeaderboard(period: string = 'week', limit: number = 20) {
    const params = new URLSearchParams({
      period,
      limit: limit.toString(),
    });
    return this.request(`/leaderboards/friends?${params}`);
  }

  async getSubjectLeaderboard(subject: string, period: string = 'month', limit: number = 20, page: number = 1) {
    const params = new URLSearchParams({
      period,
      limit: limit.toString(),
      page: page.toString(),
    });
    return this.request(`/leaderboards/subject/${subject}?${params}`);
  }

  // Friend endpoints
  async getFriends() {
    return this.request('/friends');
  }

  async getPendingFriendRequests() {
    return this.request('/friends/pending');
  }

  async getSentFriendRequests() {
    return this.request('/friends/sent');
  }

  async addFriend(friendEmail: string) {
    return this.request('/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendEmail }),
    });
  }

  async acceptFriendRequest(friendshipId: string) {
    return this.request(`/friends/${friendshipId}/accept`, {
      method: 'PUT',
    });
  }

  async rejectFriendRequest(friendshipId: string) {
    return this.request(`/friends/${friendshipId}/reject`, {
      method: 'PUT',
    });
  }

  async removeFriend(friendshipId: string) {
    return this.request(`/friends/${friendshipId}`, {
      method: 'DELETE',
    });
  }

  async blockUser(friendshipId: string) {
    return this.request(`/friends/${friendshipId}/block`, {
      method: 'PUT',
    });
  }

  async searchUsers(query: string, limit: number = 10) {
    return this.request(`/friends/search?query=${encodeURIComponent(query)}&limit=${limit}`);
  }

  // Achievement endpoints
  async getAchievements() {
    return this.request('/achievements');
  }

  async getAchievement(id: string) {
    return this.request(`/achievements/${id}`);
  }

  async getUserAchievements(userId: string) {
    return this.request(`/achievements/user/${userId}`);
  }

  async checkAchievements(userId: string) {
    return this.request(`/achievements/check/${userId}`, {
      method: 'POST',
    });
  }

  async getAchievementStats() {
    return this.request('/achievements/stats/overview');
  }

  async getAchievementProgress(userId: string) {
    return this.request(`/achievements/progress/${userId}`);
  }
}

export const apiService = new ApiService();
export default apiService;
