import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import re

# 시간 문자열을 분 단위로 변환하는 함수
def time_to_minutes(time_str):
    hour, minute = map(int, time_str.split(':'))
    return hour * 60 + minute

# 분 단위를 시간 문자열로 변환하는 함수
def minutes_to_time(minutes):
    hour = int(minutes // 60)
    minute = int(minutes % 60)
    return f"{hour:02d}:{minute:02d}"

# 데이터 로드
standard_df = pd.read_csv('randomForestRegressor/gStation_standard.csv')
real_df = pd.read_csv('randomForestRegressor/real_data.csv')

# 요일 매핑
day_mapping = {'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4}
real_df['DAY_NUM'] = real_df['DAY'].map(day_mapping)

# 출발 위치 매핑
location_mapping = {'SCH': 'SCHOOL_DEPART', 'STA': 'STATION_DEPART'}
real_df['LOCATION'] = real_df['DEPART_AT'].map(location_mapping)

# 시간을 분으로 변환
real_df['TIME_MINUTES'] = real_df['DEPART_TIME'].apply(time_to_minutes)

# 데이터 준비
# 학교 출발 데이터와 역 출발 데이터 분리
school_data = real_df[real_df['LOCATION'] == 'SCHOOL_DEPART'].copy()
station_data = real_df[real_df['LOCATION'] == 'STATION_DEPART'].copy()

# 표준 시간표에서 학교 출발과 역 출발 시간 추출
# 요일별로 처리
days = ['MON', 'TUE', 'WED', 'THU', 'FRI']
columns = []
for day in days:
    columns.append(f"{day}_FIXED")
    columns.append(f"{day}_SCHOOL_DEPART")
    columns.append(f"{day}_STATION_DEPART")

# 조정된 시간표를 저장할 DataFrame 생성
adjusted_df = standard_df.copy()

# 각 요일별로 조정
for day_idx, day in enumerate(days):
    # 현재 요일의 실제 데이터
    day_school_data = school_data[school_data['DAY_NUM'] == day_idx].copy()
    day_station_data = station_data[station_data['DAY_NUM'] == day_idx].copy()
    
    # 현재 요일의 FIXED, SCHOOL_DEPART, STATION_DEPART 컬럼
    fixed_col = f"{day}_FIXED"
    school_col = f"{day}_SCHOOL_DEPART"
    station_col = f"{day}_STATION_DEPART"
    
    # 표준 시간표에서 시간을 분으로 변환
    standard_df[f"{school_col}_MINUTES"] = standard_df[school_col].apply(time_to_minutes)
    standard_df[f"{station_col}_MINUTES"] = standard_df[station_col].apply(time_to_minutes)
    
    # 시간대별로 그룹화
    # FIXED=TRUE를 기준으로 그룹 구분
    groups = []
    current_group = []
    
    for i, row in standard_df.iterrows():
        current_group.append(i)
        if row[fixed_col] == True:
            groups.append(current_group)
            current_group = []
    
    if current_group:  # 마지막 그룹이 남아있으면 추가
        groups.append(current_group)
    
    # 각 그룹별로 RandomForest 모델 훈련 및 예측
    for group in groups:
        if len(group) <= 1:  # 단일 행 그룹은 고정된 것이므로 건너뜁니다
            continue
        
        # 그룹의 시간 범위 확인
        start_time = standard_df.loc[group[0], f"{school_col}_MINUTES"]
        end_time = standard_df.loc[group[-1], f"{school_col}_MINUTES"]
        
        # 해당 시간 범위의 실제 데이터 필터링
        relevant_school_data = day_school_data[
            (day_school_data['TIME_MINUTES'] >= start_time - 10) & 
            (day_school_data['TIME_MINUTES'] <= end_time + 10)
        ]
        
        # 실제 데이터가 충분하지 않으면 건너뜁니다
        if len(relevant_school_data) < 2:
            continue
        
        # 특성 생성: 시간대의 순서 (0, 1, 2, ...)
        X = np.array(range(len(group))).reshape(-1, 1)
        
        # 타겟: 기존 시간표 시간 (분)
        y_school = standard_df.loc[group, f"{school_col}_MINUTES"].values
        
        # RandomForest 모델 훈련
        model_school = RandomForestRegressor(n_estimators=100, random_state=42)
        model_school.fit(X, y_school)
        
        # 예측
        y_school_pred = model_school.predict(X)
        
        # 실제 데이터를 고려하여 예측 조정
        # 첫 번째와 마지막 로우는 유지 (경계 조건)
        y_school_adjusted = y_school_pred.copy()
        
        # 첫 번째와 마지막 값은 원래 값 유지
        y_school_adjusted[0] = y_school[0]
        y_school_adjusted[-1] = y_school[-1]
        
        # 시간이 순서대로 증가하도록 보장
        for i in range(1, len(y_school_adjusted)):
            if y_school_adjusted[i] <= y_school_adjusted[i-1]:
                y_school_adjusted[i] = y_school_adjusted[i-1] + 1
        
        # FIXED=TRUE인 행은 원래 시간으로 유지
        for i, idx in enumerate(group):
            if standard_df.loc[idx, fixed_col] == True:
                y_school_adjusted[i] = y_school[i]
        
        # 결과 저장 (분 -> 시간 문자열)
        for i, idx in enumerate(group):
            if standard_df.loc[idx, fixed_col] == False:  # FIXED=FALSE인 경우만 조정
                adjusted_df.loc[idx, school_col] = minutes_to_time(y_school_adjusted[i])
                
                # 학교 출발 시간을 조정했으므로 역 도착 시간도 조정 (일반적으로 15분 소요)
                school_minutes = y_school_adjusted[i]
                station_minutes = school_minutes + 15  # 학교에서 역까지 15분 소요
                adjusted_df.loc[idx, station_col] = minutes_to_time(station_minutes)

# 결과 저장
adjusted_df.to_csv('randomForestRegressor/cursor_gStation.csv', index=False)
print("조정된 시간표가 cursor_gStation.csv 파일에 저장되었습니다.")
