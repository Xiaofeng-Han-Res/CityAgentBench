"""Frozen pilot checks. Unrecognized semantic answers remain pending blind review."""
import json
import math
import re
import unicodedata

def norm(value):
    if not isinstance(value,str):value=json.dumps(value,ensure_ascii=False)
    return re.sub(r'[\s。.!！,，:：;；"\'`]+','',unicodedata.normalize('NFKC',value).casefold())

def iou(a,b):
    w=max(0,min(a[2],b[2])-max(a[0],b[0]));h=max(0,min(a[3],b[3])-max(a[1],b[1]))
    overlap=w*h;union=(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-overlap
    return overlap/union if union>0 else 0

def text_score(answer,truth,observations):
    kind=truth['kind']
    if kind=='arrival_only':return {'passed':True,'method':'arrival_only'}
    if kind=='letter':return {'passed':isinstance(answer,str) and answer.strip().upper()==truth['answer'],'method':'fixed_option_letter'}
    if kind=='integer':
        try:n=int(str(answer).strip());ok=str(answer).strip()==str(n) and n==truth['answer']
        except (ValueError,TypeError):ok=False
        return {'passed':ok,'method':'exact_integer'}
    if kind=='box':
        if not isinstance(answer,dict) or set(answer)!={'box','observation_id'}:
            return {'passed':False,'method':'invalid_box_contract'}
        box=answer['box'];oid=answer['observation_id']
        if not isinstance(box,list) or len(box)!=4 or any(type(n) not in (int,float) or not math.isfinite(n) or not 0<=n<=1 for n in box) or box[0]>=box[2] or box[1]>=box[3]:
            return {'passed':False,'method':'invalid_normalized_box'}
        if oid not in observations:return {'passed':False,'method':'unknown_observation_id'}
        if truth.get('reference_initial_boxes') is not None:
            if oid!='obs_000':return {'passed':False,'method':'box_must_reference_initial_image'}
            overlap=max((iou(box,b) for b in truth['reference_initial_boxes']),default=0)
            return {'passed':overlap>=.5,'method':'frozen_initial_reference_boxes_iou_0_5','iou':overlap}
        target=next((t for t in truth.get('frames',[]) if t['sha256']==observations[oid]['sha256']),None)
        if target is None:return {'passed':None,'method':'pending_blind_box_annotation','observation_id':oid,'image_sha256':observations[oid]['sha256']}
        overlap=max((iou(box,b) for b in target['boxes']),default=0)
        return {'passed':overlap>=.5,'method':'any_valid_target_iou_0_5','iou':overlap}
    if kind in ('text','semantic'):
        value=norm(answer)
        if value in [norm(x) for x in truth['accepted']]:return {'passed':True,'method':'frozen_equivalent_expression'}
        if value in [norm(x) for x in truth.get('rejected',[])]:return {'passed':False,'method':'frozen_wrong_expression'}
        if answer in (None,''):return {'passed':False,'method':'missing_answer'}
        return {'passed':None,'method':'pending_blind_semantic_review','rubric':truth['rubric']}
    raise ValueError('Unknown frozen scoring type')

def score(question,result):
    arrival=True;details={}
    if question['task']['level']=='L2':
        rule=question['arrival'];actual=result['final_state']['robot']['position_cm'];goal=rule['center_ground_cm']
        horizontal=math.dist(actual[:2],goal[:2])/100;vertical=abs(actual[2]-goal[2]-2)/100
        arrival=horizontal<=rule['horizontal_radius_m'] and vertical<=rule['vertical_tolerance_m'] and result['distance_m']>=rule['minimum_distance_m']
        details={'horizontal_distance_m':horizontal,'vertical_error_m':vertical,'actual_movement':result['distance_m']>=rule['minimum_distance_m']}
        visits=[]
        path=[result['start_state']['robot']['position_cm']]+[x['native']['private']['after']['position_cm'] for x in result['steps'] if x.get('native')]
        for p in rule.get('route_checkpoints_cm',[]):
            visits.append(min(math.dist(p[:2],x[:2])/100 for x in path)<=4)
        if visits:arrival=arrival and all(visits);details['route_checkpoint_visits']=visits
    observations={o['id']:o for o in result['observations']}
    answer=text_score(result.get('answer'),question['truth'],observations)
    success=False if result['termination'] not in ('answer','stop') or not arrival else answer['passed']
    return {'success':success,'arrival_passed':arrival,'arrival_details':details,'answer':answer,
            'termination':result['termination'],'formal_evaluation':False}
