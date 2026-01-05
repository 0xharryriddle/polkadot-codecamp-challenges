/**
 * Agent Tool Utilities
 * 
 * Provides utility functions for creating tools compatible with
 * the polkadot-agent-kit pattern without importing heavy dependencies.
 */

import type { ZodSchema } from 'zod';

/**
 * Tool configuration interface following polkadot-agent-kit pattern
 */
export interface ToolConfig {
    name: string;
    description: string;
    schema: ZodSchema;
}

/**
 * Tool response interface
 */
export interface ToolResponse {
    success: boolean;
    data?: string;
    error?: string;
    toolName: string;
}

/**
 * Tool action interface
 */
export interface ToolAction {
    name: string;
    description: string;
    schema: ZodSchema;
    invoke: (args: Record<string, unknown>) => Promise<ToolResponse>;
}

/**
 * Create a success response
 */
export function createSuccessResponse(data: string, toolName: string): ToolResponse {
    return {
        success: true,
        data,
        toolName,
    };
}

/**
 * Create an error response
 */
export function createErrorResponse(error: string, toolName: string): ToolResponse {
    return {
        success: false,
        error,
        toolName,
    };
}

/**
 * Tool interface - accepts any args that will be validated by schema
 */
export interface Tool {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: (args: any) => Promise<ToolResponse>;
}

/**
 * Create a tool action from a tool and config
 * This follows the polkadot-agent-kit createAction pattern
 */
export function createToolAction(tool: Tool, config: ToolConfig): ToolAction {
    return {
        name: config.name,
        description: config.description,
        schema: config.schema,
        invoke: async (args: Record<string, unknown>) => {
            // Validate args against schema
            const parsed = config.schema.safeParse(args);
            if (!parsed.success) {
                return createErrorResponse(
                    `Invalid arguments: ${parsed.error.message}`,
                    config.name
                );
            }
            return tool.invoke(parsed.data);
        },
    };
}
