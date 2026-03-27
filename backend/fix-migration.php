<?php
$db = new SQLite3('database/database.sqlite');
$db->exec("DELETE FROM migrations WHERE migration = '2024_03_26_170930_add_loyalty_level_to_loyalty_cards_table';");
$db->exec("INSERT INTO migrations (migration, batch) VALUES ('2024_03_26_170930_add_loyalty_level_to_loyalty_cards_table', 1);");
echo "Migration marked as completed!\n";
?>