/**
 * FloatingWidget - Permanent cookie settings button
 * Stays visible at all times for easy access to preferences
 */
import { ConsentConfig } from '../types';
import { EventEmitter } from '../core/EventEmitter';
export declare class FloatingWidget {
    private config;
    private element;
    private eventEmitter;
    private isVisible;
    constructor(config: ConsentConfig, eventEmitter: EventEmitter);
    /**
     * Show the floating widget
     */
    show(): void;
    /**
     * Hide the floating widget
     */
    hide(): void;
    /**
     * Destroy the widget
     */
    destroy(): void;
    /**
     * Check if widget is visible
     */
    getIsVisible(): boolean;
    /**
     * Create DOM structure for floating widget
     */
    private createDOM;
    /**
     * Attach event listeners
     */
    private attachListeners;
    /**
     * Handle widget click
     */
    private handleClick;
}
