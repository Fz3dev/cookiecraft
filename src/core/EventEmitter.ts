/**
 * EventEmitter - Simple pub/sub pattern for internal and external events
 */

export class EventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  /**
   * Register an event handler
   */
  public on(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  /**
   * Unregister an event handler
   */
  public off(event: string, callback: Function): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(callback);
    }
  }

  /**
   * Emit an event with optional data
   */
  public emit(event: string, data?: any): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in event handler for ${event}:`, e);
        }
      });
    }
  }

  /**
   * Clear all event handlers
   */
  public clear(): void {
    this.events.clear();
  }

  /**
   * Clear handlers for a specific event
   */
  public clearEvent(event: string): void {
    this.events.delete(event);
  }
}
