"""Read-only local HTTP smoke benchmark; not a concurrent-user certification."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import http.client
import json
import math
import threading
import time
from collections import Counter
from urllib.parse import urlparse


def benchmark(args):
    base=urlparse(args.base)
    if base.hostname not in {'localhost','127.0.0.1','::1'} or base.scheme != 'http':
        raise SystemExit('This smoke test only accepts a local HTTP server.')
    if not 1 <= args.concurrency <= 500 or not 1 <= args.requests <= 20000:
        raise SystemExit('Use concurrency 1–500 and requests 1–20000.')
    local=threading.local()
    connections=[]
    def one(index):
        if not hasattr(local,'connection'):
            local.connection=http.client.HTTPConnection(base.hostname,base.port or 80,timeout=15)
            connections.append(local.connection)
        started=time.perf_counter()
        try:
            local.connection.request('GET','/api/v1/owner/model' if index%4==0 else '/health')
            response=local.connection.getresponse()
            response.read()
            status=str(response.status)
        except (OSError,http.client.HTTPException) as error:
            status=type(error).__name__
            local.connection.close()
        return status,(time.perf_counter()-started)*1000
    started=time.perf_counter()
    try:
        with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            results=list(pool.map(one,range(args.requests)))
    finally:
        for connection in connections: connection.close()
    elapsed=time.perf_counter()-started
    statuses=Counter(status for status,_ in results)
    timings=sorted(duration for _,duration in results)
    def percentile(fraction): return round(timings[math.ceil(fraction*len(timings))-1],2)
    report={'scope':'Local read-only HTTP smoke; synthetic model; excludes login, saves, camera, speech, uploads and external translation',
            'max_in_flight':args.concurrency,'requests':args.requests,'statuses':dict(statuses),'seconds':round(elapsed,3),
            'requests_per_second':round(args.requests/elapsed,1),'latency_ms':{'p50':percentile(.5),'p95':percentile(.95),'p99':percentile(.99),'max':round(max(timings),2)}}
    print(json.dumps(report,indent=2))
    if args.output:
        with open(args.output,'w') as file: json.dump(report,file,indent=2)
    if statuses.get('200',0)!=args.requests: raise SystemExit(1)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',default='http://127.0.0.1:8002')
    parser.add_argument('--concurrency',type=int,default=50)
    parser.add_argument('--requests',type=int,default=500)
    parser.add_argument('--output')
    benchmark(parser.parse_args())
