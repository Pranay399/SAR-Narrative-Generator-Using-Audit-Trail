import mlflow
import json

def log_experiment(run_name: str, parameters: dict, metrics: dict, artifacts: dict = None):
    """
    MLflow Tracking wrapper to log detection logic, risk scores, and reason codes
    as specified in the architecture diagram.
    """
    try:
        with mlflow.start_run(run_name=run_name):
            # Log standard parameters (e.g. models used, thresholds)
            mlflow.log_params(parameters)
            
            # Log calculated risk metrics
            mlflow.log_metrics(metrics)
            
            # Log any generative artifacts like the generated narrative or reasoning JSON
            if artifacts:
                for filename, content in artifacts.items():
                    with open(filename, "w") as f:
                        if isinstance(content, dict):
                            json.dump(content, f)
                        else:
                            f.write(content)
                    mlflow.log_artifact(filename)
    except Exception as e:
        print(f"MLflow logging failed (is server running?): {e}")
