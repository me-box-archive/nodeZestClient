#!/bin/bash

ME='nodeZestClient'

source test/utils.sh

CMD="node ./client/client.js "

EXPECTED=""
RES=$($CMD --method post --format json --path /kv/test/data --payload "{\"name\":\"tosh\",\"age\":38}")
test_assert "$EXPECTED" "$RES" "Test KV POST JSON "

EXPECTED='{"name":"tosh","age":38}'
RES=$($CMD --method get --format json --path /kv/test/data)
test_assert "$EXPECTED" "$RES" "Test KV GET JSON "

EXPECTED=""
RES=$($CMD --method post --format text --path /kv/test/data --payload "{\"name\":\"Tosh\",\"age\":37}")
test_assert "$EXPECTED" "$RES" "Test KV POST TEXT "

EXPECTED='{"name":"Tosh","age":37}'
RES=$($CMD --method get --format text --path /kv/test/data)
test_assert "$EXPECTED" "$RES" "Test KV GET TEXT "

EXPECTED=""
RES=$($CMD --method post --format binary --path /kv/test/data --payload "{\"name\":\"tosh\",\"age\":36}")
test_assert "$EXPECTED" "$RES" "Test KV POST BINARY "

EXPECTED='{"name":"tosh","age":36}'
RES=$($CMD --method get --format binary --path /kv/test/data)
test_assert "$EXPECTED" "$RES" "Test KV GET BINARY "

EXPECTED=""
RES=$($CMD --method post --format json --path /ts/blob/test --payload "{\"name\":\"tosh\",\"age\":38}")
test_assert "$EXPECTED" "$RES" "Test TS POST JSON "

EXPECTED=""
RES=$($CMD --method post --format json --path /ts/blob/test --payload "{\"name\":\"tosh\",\"age\":39}")
test_assert "$EXPECTED" "$RES" "Test TS POST JSON "

EXPECTED=""
RES=$($CMD --method post --format json --path /ts/blob/test --payload "{\"name\":\"tosh\",\"age\":40}")
test_assert "$EXPECTED" "$RES" "Test TS POST JSON "

EXPECTED='{"name":"tosh","age":40}'
RES=$($CMD --method get --format json --path /ts/blob/test/latest)
test_contains "$EXPECTED" "$RES" "Test TS GET LATEST JSON "

EXPECTED='{"name":"tosh","age":39}'
RES=$($CMD --method get --format json --path /ts/blob/test/last/2)
test_contains "$EXPECTED" "$RES" "Test TS GET LAST 2 JSON "