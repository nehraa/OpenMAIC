/**
 * Initialize the core classroom engine for a session.
 * TODO: Integrate with core/app/classroom — this is a stub for now.
 */
export async function initializeSessionRoom(
  sessionId: string,
  options: { corePath: string; config: Record<string, unknown> }
): Promise<void> {
  console.log(`[stub] initializeSessionRoom(${sessionId}, ${options.corePath})`)
  console.log(`[stub] config:`, JSON.stringify(options.config))
}
