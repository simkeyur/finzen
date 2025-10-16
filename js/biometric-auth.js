// Biometric Authentication Module for FinZen
// Handles fingerprint/face recognition for iOS and Android

class BiometricAuth {
  constructor() {
    this.isAuthenticated = false;
    this.isSupported = false;
    this.authType = null;
  }

  /**
   * Check if biometric authentication is supported
   */
  async checkSupport() {
    if (!window.PublicKeyCredential) {
      this.isSupported = false;
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      this.isSupported = available;

      // Determine auth type
      if (navigator.userAgent.includes('Android')) {
        this.authType = 'fingerprint'; // Android typically uses fingerprint
      } else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        this.authType = 'face'; // iOS typically uses Face ID
      } else {
        this.authType = 'biometric';
      }

      return available;
    } catch (error) {
      console.log('Biometric check failed:', error);
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Request biometric authentication
   */
  async authenticate() {
    if (!this.isSupported) {
      throw new Error('Biometric authentication not supported on this device');
    }

    try {
      // Create authentication options
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [], // Empty to allow any credential
        userVerification: 'required',
        timeout: 60000 // 60 seconds
      };

      // Request authentication
      const assertion = await navigator.credentials.get({
        publicKey: credentialRequestOptions
      });

      if (assertion) {
        this.isAuthenticated = true;
        this.saveAuthState();
        return true;
      }

      return false;
    } catch (error) {
      console.log('Authentication failed:', error);
      this.isAuthenticated = false;

      // Handle different error types
      if (error.name === 'NotAllowedError') {
        throw new Error('Authentication was cancelled or timed out');
      } else if (error.name === 'SecurityError') {
        throw new Error('Authentication failed due to security restrictions');
      } else {
        throw new Error('Authentication failed: ' + error.message);
      }
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Save authentication state to localStorage
   */
  saveAuthState() {
    const authData = {
      authenticated: this.isAuthenticated,
      timestamp: Date.now(),
      type: this.authType
    };
    localStorage.setItem('biometric_auth', JSON.stringify(authData));
  }

  /**
   * Load authentication state from localStorage
   */
  loadAuthState() {
    try {
      const authData = localStorage.getItem('biometric_auth');
      if (authData) {
        const data = JSON.parse(authData);
        // Check if authentication is still valid (within 24 hours)
        const isValid = (Date.now() - data.timestamp) < (24 * 60 * 60 * 1000);
        if (isValid && data.authenticated) {
          this.isAuthenticated = true;
          this.authType = data.type;
          return true;
        }
      }
    } catch (error) {
      console.log('Error loading auth state:', error);
    }
    return false;
  }

  /**
   * Clear authentication state
   */
  logout() {
    this.isAuthenticated = false;
    localStorage.removeItem('biometric_auth');
  }

  /**
   * Get authentication type for UI display
   */
  getAuthTypeDisplay() {
    switch (this.authType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  }
}

// Global biometric auth instance
const biometricAuth = new BiometricAuth();