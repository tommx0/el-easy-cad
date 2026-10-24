import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import type { Fehlerprotokollierer } from './fehlerprotokoll'
import type { Uebersetzer } from '../src/sprache'
import { alsText, deutsch, uebersetzerFuer, type ServerText } from './sprache'

export class ApiFehler extends Error {
  readonly status: number
  readonly code: string
  readonly text: string | ServerText

  constructor(status: number, code: string, nachricht: string | ServerText) {
    super(alsText(nachricht, deutsch))
    this.name = 'ApiFehler'
    this.text = nachricht
    this.status = status
    this.code = code
  }

  static nichtGefunden(nachricht: string | ServerText): ApiFehler {
    return new ApiFehler(404, 'nicht-gefunden', nachricht)
  }

  static ungueltig(nachricht: string | ServerText): ApiFehler {
    return new ApiFehler(400, 'ungueltig', nachricht)
  }

  static konflikt(nachricht: string | ServerText): ApiFehler {
    return new ApiFehler(409, 'konflikt', nachricht)
  }

  static nurKopie(nachricht: string | ServerText): ApiFehler {
    return new ApiFehler(409, 'nur-kopie', nachricht)
  }

  static geschuetzt(nachricht: string | ServerText): ApiFehler {
    return new ApiFehler(403, 'geschuetzt', nachricht)
  }

  static lizenzErforderlich(nachricht: string | ServerText): ApiFehler {
    return new ApiFehler(403, 'lizenz-erforderlich', nachricht)
  }
}

export interface FehlerAntwort {
  fehler: { code: string; nachricht: string }
}

function antwort(code: string, nachricht: string): FehlerAntwort {
  return { fehler: { code, nachricht } }
}

export function registriereFehlerbehandlung(
  app: FastifyInstance,
  fehlerprotokollierer: Fehlerprotokollierer,
): void {
  app.setErrorHandler((fehler, anfrage, ausgabe) => {
    const t = uebersetzerFuer(anfrage)
    if (fehler instanceof ApiFehler) {
      void ausgabe.status(fehler.status).send(antwort(fehler.code, alsText(fehler.text, t)))
      return
    }
    if (fehler instanceof ZodError) {
      const erste = fehler.issues[0]
      const stelle = erste?.path.join('.')
      void ausgabe
        .status(400)
        .send(
          antwort(
            'validierung',
            stelle
              ? t('server.fehler.feld', { stelle, meldung: erste?.message ?? '' })
              : (erste?.message ?? t('server.fehler.ungueltigeDaten')),
          ),
        )
      return
    }
    anfrage.log.error({ err: fehler }, 'Unerwarteter Fehler')
    fehlerprotokollierer.protokolliere({
      quelle: 'server',
      nachricht: fehler instanceof Error ? fehler.message : String(fehler),
      stack: fehler instanceof Error ? fehler.stack : undefined,
      kontext: `${anfrage.method} ${anfrage.url}`,
    })
    void ausgabe.status(500).send(antwort('intern', t('server.fehler.intern')))
  })
}

export function nichtGefundenAntwort(
  methode: string,
  url: string,
  t: Uebersetzer = deutsch,
): FehlerAntwort {
  return antwort('nicht-gefunden', t('server.fehler.keinEndpunkt', { methode, url }))
}
