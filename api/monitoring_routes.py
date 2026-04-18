import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from deps import get_required_user_id, get_supabase_client

router = APIRouter(prefix='/api/v1/monitoring', tags=['monitoring'])

class AddWatchlistItem(BaseModel):
    url: str
    type: str  # 'self' or 'competitor'
    label: Optional[str] = None

class WatchlistResponse(BaseModel):
    id: str
    url: str
    type: str
    label: Optional[str]
    active: bool
    last_score: Optional[int]
    last_scan_at: Optional[str]

# GET /api/v1/monitoring/watchlist
@router.get('/watchlist')
async def get_watchlist(user_id: str = Depends(get_required_user_id)):
    """Get user's monitored URLs."""
    supabase = get_supabase_client()

    # Check user is Pro
    sub = supabase.table('subscriptions').select('tier').eq('user_id', user_id).eq('status', 'active').limit(1).execute()
    if not sub.data or sub.data[0].get('tier') != 'pro':
        raise HTTPException(status_code=403, detail='Pro subscription required for monitoring')

    result = supabase.table('watchlist').select('*').eq('user_id', user_id).eq('active', True).order('created_at').execute()
    return {'watchlist': result.data or []}

# POST /api/v1/monitoring/watchlist
@router.post('/watchlist')
async def add_to_watchlist(item: AddWatchlistItem, user_id: str = Depends(get_required_user_id)):
    """Add a URL to monitoring watchlist."""
    supabase = get_supabase_client()

    # Check Pro
    sub = supabase.table('subscriptions').select('tier').eq('user_id', user_id).eq('status', 'active').limit(1).execute()
    if not sub.data or sub.data[0].get('tier') != 'pro':
        raise HTTPException(status_code=403, detail='Pro subscription required')

    # Check limits: 1 self + 2 competitors = 3 max
    existing = supabase.table('watchlist').select('id, type').eq('user_id', user_id).eq('active', True).execute()
    current = existing.data or []

    self_count = sum(1 for w in current if w['type'] == 'self')
    competitor_count = sum(1 for w in current if w['type'] == 'competitor')

    if item.type == 'self' and self_count >= 1:
        raise HTTPException(status_code=400, detail='You can only monitor 1 of your own sites')
    if item.type == 'competitor' and competitor_count >= 2:
        raise HTTPException(status_code=400, detail='You can monitor up to 2 competitors')

    # Normalize URL
    url = item.url.strip().lower()
    if not url.startswith('http'):
        url = f'https://{url}'

    # Insert
    try:
        result = supabase.table('watchlist').insert({
            'user_id': user_id,
            'url': url,
            'type': item.type,
            'label': item.label or (url.replace('https://', '').split('/')[0]),
            'active': True,
        }).execute()

        return {'success': True, 'item': result.data[0] if result.data else None}
    except Exception as e:
        if 'duplicate' in str(e).lower() or 'unique' in str(e).lower():
            raise HTTPException(status_code=400, detail='This URL is already being monitored')
        raise HTTPException(status_code=500, detail=str(e))

# DELETE /api/v1/monitoring/watchlist/{item_id}
@router.delete('/watchlist/{item_id}')
async def remove_from_watchlist(item_id: str, user_id: str = Depends(get_required_user_id)):
    """Remove a URL from watchlist (soft delete)."""
    supabase = get_supabase_client()

    # Verify ownership
    item = supabase.table('watchlist').select('user_id').eq('id', item_id).single().execute()
    if not item.data or item.data['user_id'] != user_id:
        raise HTTPException(status_code=404, detail='Not found')

    supabase.table('watchlist').update({'active': False}).eq('id', item_id).execute()
    return {'success': True}

# GET /api/v1/monitoring/comparison
@router.get('/comparison')
async def get_comparison(user_id: str = Depends(get_required_user_id)):
    """Get comparison data for all monitored URLs."""
    supabase = get_supabase_client()

    # Get watchlist
    watchlist = supabase.table('watchlist').select('*').eq('user_id', user_id).eq('active', True).execute()
    items = watchlist.data or []

    comparison = []
    for item in items:
        # Get score history (last 12 entries = ~3 months of weekly scans)
        history = supabase.table('score_history').select('score, scanned_at').eq('watchlist_id', item['id']).order('scanned_at', desc=True).limit(12).execute()

        comparison.append({
            'id': item['id'],
            'url': item['url'],
            'type': item['type'],
            'label': item['label'],
            'current_score': item.get('last_score'),
            'last_scan_at': item.get('last_scan_at'),
            'history': list(reversed(history.data or [])),  # chronological order
        })

    return {'comparison': comparison}

# POST /api/v1/monitoring/scan-now
@router.post('/scan-now')
async def trigger_manual_scan(user_id: str = Depends(get_required_user_id)):
    """Manually trigger a scan of all watchlist URLs. Pro only."""
    supabase = get_supabase_client()

    # Check Pro
    sub = supabase.table('subscriptions').select('tier').eq('user_id', user_id).eq('status', 'active').limit(1).execute()
    if not sub.data or sub.data[0].get('tier') != 'pro':
        raise HTTPException(status_code=403, detail='Pro subscription required')

    watchlist = supabase.table('watchlist').select('*').eq('user_id', user_id).eq('active', True).execute()
    items = watchlist.data or []

    results = []
    for item in items:
        try:
            # Use existing scanner
            from scanner.engine import run_scan
            scan_result = await run_scan(item['url'])
            score = scan_result.overall_score

            # Save to score_history
            supabase.table('score_history').insert({
                'watchlist_id': item['id'],
                'score': round(score),
                'modules': [module.dict() for module in scan_result.modules],
            }).execute()

            # Update watchlist last_score and last_scan_at
            supabase.table('watchlist').update({
                'last_score': round(score),
                'last_scan_at': datetime.utcnow().isoformat(),
            }).eq('id', item['id']).execute()

            results.append({'url': item['url'], 'score': round(score), 'status': 'ok'})
        except Exception as e:
            results.append({'url': item['url'], 'score': None, 'status': f'error: {str(e)}'})

    return {'results': results}