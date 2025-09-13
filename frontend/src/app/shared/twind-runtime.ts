// DEPRECATED: Usa TwindService (../../shared/twind.service) en su lugar.
// Este wrapper existe solo para mantener compatibilidad con imports antiguos.
import { TwindService } from './twind.service';

const __twindServiceSingleton = new TwindService();

export async function applyTwindToContainer(container?: Element) {
  return __twindServiceSingleton.applyToContainer(container);
}
