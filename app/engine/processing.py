from app.core.config import settings
import json
import os

import pandas as pd
import logging

# Hard-disable Spark for this environment to avoid JVM getSubject thread crashes
spark = None
print("[Engine] MODE: Using High-Performance Pandas AML Engine.")

def process_case_data(file_path: str, format: str = "csv"):
    """
    Ingests raw transaction data, cleans it, and applies AML Feature Engineering.
    Hardcoded to use Pandas for stability in the current demo environment.
    """
    print(f"[Data] Processing case data: {file_path}")
    return _process_with_pandas(file_path, format)

def _process_with_spark(file_path: str, format: str):
    from pyspark.sql import SparkSession
    from pyspark.sql.functions import col, sum as spark_sum, count as spark_count, when, unix_timestamp, lag, abs as spark_abs
    from pyspark.sql.window import Window

    if format.lower() == "csv":
        df = spark.read.option("header", "true").csv(file_path)
    else:
        df = spark.read.json(file_path)
        
    # Standardize column names
    if "account_number" in df.columns and "account_id" not in df.columns:
        df = df.withColumnRenamed("account_number", "account_id")
    if "location" in df.columns and "destination_country" not in df.columns:
        df = df.withColumnRenamed("location", "destination_country")

    df = df.withColumn("amount", col("amount").cast("double"))
    
    if "is_foreign" in df.columns:
        df = df.withColumn("foreign_transfer_risk", when(col("is_foreign") == True, 1).otherwise(0))
    else:
        df = df.withColumn("foreign_transfer_risk", when(col("destination_country") != "US", 1).otherwise(0))
    
    df = df.withColumn("high_value_txn", when(col("amount") > 10000, 1).otherwise(0))
    
    # Aggregations
    account_features = df.groupBy("account_id").agg(
        spark_sum("amount").alias("total_txn_volume"),
        spark_count("txn_id").alias("txn_frequency_score"),
        spark_sum("foreign_transfer_risk").alias("total_foreign_transfers"),
        spark_sum("high_value_txn").alias("large_txns_count")
    )
    
    smurfing_df = df.filter((col("amount") > 9000) & (col("amount") < 10000))
    smurfing_counts = smurfing_df.groupBy("account_id").agg(spark_count("txn_id").alias("smurfing_flags"))
    
    windowSpec = Window.partitionBy("account_id").orderBy("timestamp")
    df = df.withColumn("prev_ts", lag("timestamp").over(windowSpec))
    df = df.withColumn("time_diff_sec", unix_timestamp("timestamp") - unix_timestamp("prev_ts"))
    
    rapid_movements = df.filter(col("time_diff_sec") < 3600).groupBy("account_id").agg(
        spark_count("txn_id").alias("rapid_movement_flags")
    )
    
    final_features = account_features \
        .join(smurfing_counts, on="account_id", how="left") \
        .join(rapid_movements, on="account_id", how="left") \
        .fillna(0)
        
    results_json = final_features.toJSON().collect()
    return [json.loads(row) for row in results_json]

def _process_with_pandas(file_path: str, format: str):
    if format.lower() == "csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_json(file_path)

    # Standardize column names
    df = df.rename(columns={
        "account_number": "account_id",
        "location": "destination_country",
        "transaction_id": "txn_id"
    })
    
    df["amount"] = pd.to_numeric(df["amount"])
    
    # Features
    if "is_foreign" in df.columns:
        df["foreign_transfer_risk"] = df["is_foreign"].astype(int)
    else:
        df["foreign_transfer_risk"] = (df["destination_country"] != "US").astype(int)
    
    df["high_value_txn"] = (df["amount"] > 10000).astype(int)
    
    # Aggregations
    summary = df.groupby("account_id").agg({
        "amount": "sum",
        "txn_id": "count",
        "foreign_transfer_risk": "sum",
        "high_value_txn": "sum"
    }).rename(columns={
        "amount": "total_txn_volume",
        "txn_id": "txn_frequency_score",
        "foreign_transfer_risk": "total_foreign_transfers",
        "high_value_txn": "large_txns_count"
    }).reset_index()
    
    # Smurfing
    smurfing = df[(df["amount"] > 9000) & (df["amount"] < 10000)].groupby("account_id").size().reset_index(name="smurfing_flags")
    
    # Rapid Movement
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["account_id", "timestamp"])
    df["prev_ts"] = df.groupby("account_id")["timestamp"].shift(1)
    df["time_diff_sec"] = (df["timestamp"] - df["prev_ts"]).dt.total_seconds()
    rapid = df[df["time_diff_sec"] < 3600].groupby("account_id").size().reset_index(name="rapid_movement_flags")
    
    # Final Join
    final = summary.merge(smurfing, on="account_id", how="left").merge(rapid, on="account_id", how="left").fillna(0)
    return final.to_dict(orient="records")
