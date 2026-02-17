/**
 * EventEmitter - Simple pub/sub pattern for internal and external events
 */
import { EventCallback } from '../types';
export declare class EventEmitter {
    private events;
    /**
     * Register an event handler
     */
    on(event: string, callback: EventCallback): void;
    /**
     * Unregister an event handler
     */
    off(event: string, callback: EventCallback): void;
    /**
     * Emit an event with optional data
     */
    emit(event: string, data?: any): void;
    /**
     * Clear all event handlers
     */
    clear(): void;
    /**
     * Clear handlers for a specific event
     */
    clearEvent(event: string): void;
}
