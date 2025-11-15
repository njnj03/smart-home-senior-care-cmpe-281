@echo off
REM Example script to register a model on Windows
REM Usage: register_model_example.bat

python scripts\register_model.py --name "YAMNet Human Detection v1" --path "models\my_yamnet_human_model.keras" --version "v1.0" --description "YAMNet-based model for human distress detection" --type "yamnet" --activate

pause

