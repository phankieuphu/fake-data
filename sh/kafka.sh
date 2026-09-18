export KBS="localhost:9092"   # or your MSK brokers
export KCFG="$HOME/.kafka/client.properties"  # auth config (SASL/TLS)

kt()   { kafka-topics.sh --bootstrap-server "$KBS" --command-config "$KCFG" "$@"; }
ktl()  { kt --list; }
ktd()  { kt --describe --topic "$1"; }
kc()   { kafka-console-consumer.sh --bootstrap-server "$KBS" --consumer.config "$KCFG" --topic "$1" --from-beginning "${@:2}"; }
kp()   { kafka-console-producer.sh --bootstrap-server "$KBS" --producer.config "$KCFG" --topic "$1"; }
kg()   { kafka-consumer-groups.sh --bootstrap-server "$KBS" --command-config "$KCFG" --describe --group "$1"; }
