import { playerNamesCompatible } from './match-names';
import type { AuditIssue, PlayerRegistry, VaastavPlayerRow } from './types';

export function auditPlayers(
  players: VaastavPlayerRow[],
  mergedGwElementIds: readonly number[],
  mergedGwNamesByElement: ReadonlyMap<number, ReadonlySet<string>> = new Map(),
): { issues: AuditIssue[]; registry: PlayerRegistry } {
  const issues: AuditIssue[] = [];
  const byCode = new Map<number, VaastavPlayerRow>();
  const elementToCode = new Map<number, number>();
  const elementRows = new Map<number, VaastavPlayerRow>();

  for (const player of players) {
    const prevElement = elementRows.get(player.elementId);
    if (prevElement && prevElement.fplCode !== player.fplCode) {
      issues.push({
        severity: 'error',
        category: 'player',
        code: 'ELEMENT_MULTI_CODE',
        message: `Element ${player.elementId} maps to multiple codes`,
        details: {
          elementId: player.elementId,
          codeA: prevElement.fplCode,
          codeB: player.fplCode,
        },
      });
    }
    elementRows.set(player.elementId, player);

    const prevCode = byCode.get(player.fplCode);
    if (prevCode && prevCode.elementId !== player.elementId) {
      issues.push({
        severity: 'error',
        category: 'player',
        code: 'CODE_MULTI_ELEMENT',
        message: `Fpl code ${player.fplCode} maps to multiple element ids`,
        details: {
          fplCode: player.fplCode,
          elementA: prevCode.elementId,
          elementB: player.elementId,
          webNameA: prevCode.webName,
          webNameB: player.webName,
        },
      });
    }
    byCode.set(player.fplCode, player);

    const mappedCode = elementToCode.get(player.elementId);
    if (mappedCode !== undefined && mappedCode !== player.fplCode) {
      issues.push({
        severity: 'error',
        category: 'player',
        code: 'ELEMENT_CODE_CONFLICT',
        message: `Element ${player.elementId} has conflicting code assignments`,
        details: {
          elementId: player.elementId,
          existingCode: mappedCode,
          newCode: player.fplCode,
        },
      });
    }
    elementToCode.set(player.elementId, player.fplCode);

    if (player.teamCode <= 0) {
      issues.push({
        severity: 'error',
        category: 'player',
        code: 'PLAYER_MISSING_TEAM_CODE',
        message: `Player ${player.webName} (${player.fplCode}) has invalid team_code`,
        details: { fplCode: player.fplCode, elementId: player.elementId },
      });
    }
  }

  const mergedUnique = new Set(mergedGwElementIds);
  for (const elementId of mergedUnique) {
    const code = elementToCode.get(elementId);
    if (code === undefined) {
      issues.push({
        severity: 'error',
        category: 'player',
        code: 'MERGED_GW_UNKNOWN_ELEMENT',
        message: `merged_gw element ${elementId} missing from players_raw`,
        details: { elementId },
      });
      continue;
    }
    if (!byCode.has(code)) {
      issues.push({
        severity: 'error',
        category: 'player',
        code: 'MERGED_GW_MISSING_CODE',
        message: `merged_gw element ${elementId} has no registry entry for code ${code}`,
        details: { elementId, fplCode: code },
      });
      continue;
    }

    const player = elementRows.get(elementId)!;
    const gwNames = mergedGwNamesByElement.get(elementId);
    if (!gwNames || gwNames.size === 0) continue;

    const compatibleNames: string[] = [];
    const driftNames: string[] = [];
    for (const gwName of gwNames) {
      if (playerNamesCompatible(gwName, player.firstName, player.secondName, player.webName)) {
        compatibleNames.push(gwName);
      } else {
        driftNames.push(gwName);
      }
    }

    for (const gwName of driftNames) {
      issues.push({
        severity: 'warning',
        category: 'player',
        code: 'MERGED_GW_ROW_NAME_DRIFT',
        message: `merged_gw element ${elementId} row name "${gwName}" ≠ players_raw "${player.webName}" (code ${code})`,
        details: {
          elementId,
          mergedGwName: gwName,
          playersRawWebName: player.webName,
          fplCode: code,
        },
      });
    }

    if (compatibleNames.length > 0 && driftNames.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'player',
        code: 'MERGED_GW_ELEMENT_MULTI_PERSON',
        message: `merged_gw element ${elementId} used for multiple names; players_raw canonical="${player.webName}"`,
        details: {
          elementId,
          fplCode: code,
          mergedGwNames: [...gwNames].join(' | '),
          driftNames: driftNames.join(' | '),
        },
      });
    }
  }

  const registry: PlayerRegistry = {
    byCode: new Map(
      [...byCode.entries()].map(([code, p]) => [
        code,
        {
          elementId: p.elementId,
          webName: p.webName,
          firstName: p.firstName,
          secondName: p.secondName,
          teamCode: p.teamCode,
          elementType: p.elementType,
        },
      ]),
    ),
    elementToCode,
  };

  return { issues, registry };
}
