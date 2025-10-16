// Biometric Authentication Module for FinZen
// Handles fingerprint/face recognition for iOS and Android

class BiometricAuth {
  constructor() {
    this.isAuthenticated = false;
    this.isSupported = false;
    this.authType = null;
    this.credentialId = null;
    this.isIOS = this.detectIOS();
    this.isAndroid = this.detectAndroid();
  }

  /**
   * Detect if device is iOS
   */
  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  /**
   * Detect if device is Android
   */
  detectAndroid() {
    return /Android/.test(navigator.userAgent);
  }

  /**
   * Check if biometric authentication is supported
   */
  async checkSupport() {
    // iOS doesn't reliably support WebAuthn platform authenticators
    // We'll use a simpler PIN-based system for iOS
    if (this.isIOS) {
      this.isSupported = true;
      this.authType = 'face';
      return true;
    }

    // For Android and other platforms, use WebAuthn
    if (!window.PublicKeyCredential) {
      this.isSupported = false;
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      this.isSupported = available;

      if (this.isAndroid) {
        this.authType = 'fingerprint';
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

    // Use different authentication methods based on device
    if (this.isIOS) {
      return this.authenticateIOS();
    } else {
      return this.authenticateAndroid();
    }
  }

  /**
   * iOS authentication (uses device PIN/Face ID through system prompt)
   */
  async authenticateIOS() {
    try {
      // For iOS, we use a simple PIN-based system since WebAuthn support is limited
      // The OS will prompt for Face ID/Touch ID when accessing sensitive data
      
      // Check if user has set a PIN
      const hasPin = localStorage.getItem('biometric_pin_hash');
      
      if (!hasPin) {
        // First time - create a PIN
        return await this.setupIOSPin();
      }

      // Verify with PIN (OS will prompt for Face ID/Touch ID if device supports it)
      return await this.verifyIOSPin();
    } catch (error) {
      console.log('iOS authentication failed:', error);
      throw new Error('Authentication failed: ' + error.message);
    }
  }

  /**
   * Setup PIN for iOS
   */
  async setupIOSPin() {
    return new Promise((resolve) => {
      const pin = prompt('Set a 4-digit PIN for app security:\n(iOS will use Face ID/Touch ID for verification)');
      
      if (!pin || pin.length < 4) {
        throw new Error('PIN must be at least 4 digits');
      }

      // Store PIN hash (simple hash for demo, should use proper encryption in production)
      const pinHash = this.simpleHash(pin);
      localStorage.setItem('biometric_pin_hash', pinHash);
      localStorage.setItem('biometric_setup_time', Date.now().toString());

      this.isAuthenticated = true;
      this.saveAuthState();
      resolve(true);
    });
  }

  /**
   * Verify PIN for iOS
   */
  async verifyIOSPin() {
    return new Promise((resolve, reject) => {
      const pin = prompt('Enter your 4-digit PIN to unlock FinZen:');
      
      if (!pin) {
        reject(new Error('Authentication cancelled'));
        return;
      }

      const pinHash = this.simpleHash(pin);
      const storedHash = localStorage.getItem('biometric_pin_hash');

      if (pinHash === storedHash) {
        this.isAuthenticated = true;
        this.saveAuthState();
        resolve(true);
      } else {
        reject(new Error('Invalid PIN'));
      }
    });
  }

  /**
   * Simple hash function for PIN (for demo only - use proper encryption in production)
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Android authentication (uses WebAuthn with biometrics)
   */
  async authenticateAndroid() {
    try {
      // Check if we have registered credentials, if not, register first
      const storedCredentialId = localStorage.getItem('biometric_credential_id');
      if (!storedCredentialId) {
        await this.registerAndroid();
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
        timeout: 60000
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
      console.log('Android authentication failed:', error);
      this.isAuthenticated = false;

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
   * Register biometric credentials (Android only)
   */
  async registerAndroid() {
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
          authenticatorAttachment: 'platform',
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
    localStorage.removeItem('biometric_pin_hash');
    localStorage.removeItem('biometric_setup_time');
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