import type { World } from '../model';
export function electionOutcome(election: World['elections'][number]) {
    const eligible = election.candidates.map((item, index) => item.status === 'active' ? index : -1).filter(index => index >= 0), shares = [0, 0];
    let winnerId: string | null = null;
    if (eligible.length === 2) {
        const scores = election.candidates.map(item => Math.round(item.periods.reduce((sum, period) => sum + period.score, 0) / 6));
        shares[0] = Math.max(0, Math.min(10000, 5000 + (scores[0] - scores[1]) * 100 + (election.responseRoll - 50) * 40));
        shares[1] = 10000 - shares[0];
        winnerId = election.candidates[shares[0] >= 5000 ? 0 : 1].personId;
    }
    else if (eligible.length === 1) {
        shares[eligible[0]] = 10000;
        winnerId = election.candidates[eligible[0]].personId;
    }
    return { shares, winnerId };
}
