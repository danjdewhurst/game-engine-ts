import { keyMapping, type InputState } from '../components/Input';

export class InputHandler {
  private keyState: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    enter: false,
    escape: false,
  };

  private listeners: Set<(keyState: InputState) => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Set up raw mode for immediate key capture
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', this.handleKeyPress.bind(this));
    }

    this.isInitialized = true;
  }

  private handleKeyPress(data: string): void {
    const key = data.toString();

    // Handle special keys
    if (key === '\u001b[A') {
      // Up arrow
      this.updateKeyState('ArrowUp', true);
    } else if (key === '\u001b[B') {
      // Down arrow
      this.updateKeyState('ArrowDown', true);
    } else if (key === '\u001b[C') {
      // Right arrow
      this.updateKeyState('ArrowRight', true);
    } else if (key === '\u001b[D') {
      // Left arrow
      this.updateKeyState('ArrowLeft', true);
    } else if (key === '\u001b') {
      // Escape
      this.updateKeyState('Escape', true);
    } else if (key === '\r' || key === '\n') {
      // Enter
      this.updateKeyState('Enter', true);
    } else if (key === '\u0003') {
      // Ctrl+C
      this.cleanup();
      process.exit(0);
    } else {
      // Handle regular keys
      this.updateKeyState(key, true);
    }

    // Auto-release keys after short delay for terminal input
    setTimeout(() => {
      this.releaseAllKeys();
    }, 100);
  }

  private updateKeyState(key: string, pressed: boolean): void {
    const mappedKey = keyMapping[key];
    if (mappedKey) {
      this.keyState[mappedKey] = pressed;
      this.notifyListeners();
    }
  }

  private releaseAllKeys(): void {
    Object.keys(this.keyState).forEach((key) => {
      (this.keyState as any)[key] = false;
    });
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener({ ...this.keyState });
    });
  }

  public getKeyState(): InputState {
    return { ...this.keyState };
  }

  public addListener(listener: (keyState: InputState) => void): void {
    this.listeners.add(listener);
  }

  public removeListener(listener: (keyState: InputState) => void): void {
    this.listeners.delete(listener);
  }

  public cleanup(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
    this.listeners.clear();
  }

  public isKeyPressed(key: keyof InputState): boolean {
    return this.keyState[key];
  }

  public isAnyKeyPressed(): boolean {
    return Object.values(this.keyState).some((pressed) => pressed);
  }
}

// Global input handler instance
export const globalInputHandler = new InputHandler();
