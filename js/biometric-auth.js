// Biometric Authentication Module for FinZen
// Handles fingerprint/face recognition for iOS and Android

class BiometricAuth {
  constructor() {
    this.isAuthenticated = false;
    this.isSupported = false;
    this.authType = null;
    this.credentialId = null;
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
      // Check if we have registered credentials, if not, register first
      const storedCredentialId = localStorage.getItem('biometric_credential_id');
      if (!storedCredentialId) {
        await this.register();
      }

      // Create authentication options
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Use stored credential if available
      let allowCredentials = [];
      if (storedCredentialId) {
        allowCredentials = [{
          type: 'public-key',
          id: Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0))
        }];
      }

      const credentialRequestOptions = {
        challenge: challenge,
        allowCredentials: allowCredentials,
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
   * Register biometric credentials
   */
  async register() {
    try {
      // Create challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Create user ID
      const userId = new Uint8Array(32);
      window.crypto.getRandomValues(userId);

      const publicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: 'FinZen',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: 'finzen-user',
          displayName: 'FinZen User'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Force platform authenticator (Face ID/Touch ID)
          userVerification: 'required',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'direct'
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        // Store credential ID for future authentication
        this.credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem('biometric_credential_id', this.credentialId);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      throw new Error('Failed to register biometric authentication');
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
      type: this.authType,
      credentialId: this.credentialId
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
          this.credentialId = data.credentialId;
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
    this.credentialId = null;
    localStorage.removeItem('biometric_auth');
    localStorage.removeItem('biometric_credential_id');
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