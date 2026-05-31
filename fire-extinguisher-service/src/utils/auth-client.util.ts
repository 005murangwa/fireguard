/**
 * =============================================================================
 * FireGuard LTD - User Service Client Utility
 * =============================================================================
 * WHAT: Validates client user IDs against user-service before assignment.
 * WHY:  Ensures assignedClientId references a real CLIENT account.
 * =============================================================================
 */

import axios from 'axios';

interface UserProfile {
  id: number;
  role: string;
}

/**
 * Verifies that a client user exists and has the CLIENT role.
 * Called before assigning an extinguisher to a client.
 *
 * @param clientId - User ID to validate
 * @throws Error when client is not found or user-service is unreachable
 */
export async function validateClientExists(clientId: number): Promise<void> {
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:5002';

  try {
    const { data } = await axios.get<UserProfile>(`${userServiceUrl}/internal/users/${clientId}`, {
      timeout: 5000,
    });

    if (data.role !== 'CLIENT') {
      throw new Error('Assigned user is not a CLIENT account');
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Assigned client not found');
    }
    if (error instanceof Error && error.message.includes('not a CLIENT')) {
      throw error;
    }
    throw new Error('Unable to verify client account');
  }
}
