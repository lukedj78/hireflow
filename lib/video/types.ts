export interface CreateMeetingResult {
    id: string;        // ID esterno della stanza (es. ID di Daily, Room Name di LiveKit)
    url: string;       // URL completo per accedere (o URL interno dell'app se integrato)
    provider: string;  // Identificativo del provider ('daily', 'livekit', 'zoom', 'mock')
    metadata?: Record<string, unknown>;    // Dati specifici del provider (es. token host, chiavi di accesso)
}

export interface IVideoProvider {
    /**
     * Crea una nuova stanza/meeting per una videochiamata.
     * @param topic Argomento della chiamata (es. "Interview with Candidate X")
     * @param startTime Data e ora di inizio prevista
     * @param duration Durata prevista in minuti
     */
    createMeeting(topic: string, startTime: Date, duration: number): Promise<CreateMeetingResult>;

    /**
     * Genera un token di accesso per un partecipante specifico.
     * Necessario per provider integrati come LiveKit o Daily.
     * @param meetingId ID della stanza
     * @param participantName Nome visualizzato del partecipante
     * @param role Ruolo nella chiamata ('host' o 'guest')
     */
    generateToken(meetingId: string, participantName: string, role: 'host' | 'guest'): Promise<string>;

    /**
     * (Opzionale) Cancella una stanza esistente.
     */
    deleteMeeting?(meetingId: string): Promise<void>;
}
