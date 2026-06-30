import axios from 'axios';
import { RemoteInstanceDto, ConnectInstanceDto } from '../types/federation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class FederationService {
  private static async getAuthHeaders() {
    const token = localStorage.getItem('jwt_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async getConnectedInstances(): Promise<RemoteInstanceDto[]> {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/federation/instances`, { headers });
    return response.data;
  }

  static async connectToInstance(connectDto: ConnectInstanceDto): Promise<RemoteInstanceDto> {
    const headers = await this.getAuthHeaders();
    const response = await axios.post(
      `${API_BASE_URL}/federation/instances/connect`,
      connectDto,
      { headers }
    );
    return response.data;
  }

  static async blockInstance(instanceId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    await axios.post(`${API_BASE_URL}/federation/instances/${instanceId}/block`, {}, { headers });
  }

  static async unblockInstance(instanceId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    await axios.post(`${API_BASE_URL}/federation/instances/${instanceId}/unblock`, {}, { headers });
  }

  static async fetchRemoteUser(actorId: string) {
    const headers = await this.getAuthHeaders();
    const encodedActorId = encodeURIComponent(actorId);
    const response = await axios.get(`${API_BASE_URL}/federation/users/${encodedActorId}`, { headers });
    return response.data;
  }

  static async fetchRemotePost(activityId: string) {
    const headers = await this.getAuthHeaders();
    const encodedActivityId = encodeURIComponent(activityId);
    const response = await axios.get(`${API_BASE_URL}/federation/posts/${encodedActivityId}`, { headers });
    return response.data;
  }

  static async followRemoteUser(objectId: string, targetInstance: string) {
    const headers = await this.getAuthHeaders();
    const response = await axios.post(
      `${API_BASE_URL}/federation/follow`,
      { objectId, targetInstance },
      { headers }
    );
    return response.data;
  }

  static async getFederationStats() {
    const response = await axios.get(`${API_BASE_URL}/federation/stats`);
    return response.data;
  }

  static resolveFediverseHandle(handle: string) {
    const [username, domain] = handle.replace('@', '').split('@');
    return {
      username,
      domain,
      actorUrl: `https://${domain}/users/${username}`,
    };
  }
}