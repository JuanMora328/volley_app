import { describe, expect, it } from 'vitest';
import { calculateRotation, distributeIntegerAmount, generateBalancedTeams } from './index.js';
describe('dinero',()=>{it('distribuye pesos exactos determinísticamente',()=>{expect(distributeIntegerAmount(10,['b','a','c'])).toEqual({a:4,b:3,c:3});});});
describe('equipos',()=>{it('genera equipos balanceados',()=>{const r=generateBalancedTeams(Array.from({length:8},(_,i)=>({id:String(i),level:(i%5)+1})),2); expect(r.teams).toHaveLength(2); expect(Math.abs(r.teams[0].players.length-r.teams[1].players.length)).toBeLessThanOrEqual(1);});});
describe('rotación',()=>{it('reconstruye la cola',()=>{const teams:any=[0,1,2].map(i=>({id:String(i),name:`E${i}`,players:[],initialRotationPosition:i})); const r=calculateRotation(teams,[{id:'m',sequence:1,teamAId:'0',teamBId:'1',teamAScore:21,teamBScore:10,targetScore:21,winnerTeamId:'0',loserTeamId:'1'}]); expect(r.teamA.id).toBe('0'); expect(r.teamB.id).toBe('2');});});
