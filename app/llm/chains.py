from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from app.core.config import settings
import json

# Initialize Langchain Orchestrator using Llama 3.1 & Mistral via local Ollama
try:
    primary_llm = Ollama(model=settings.PRIMARY_MODEL, base_url=settings.OLLAMA_BASE_URL)
    secondary_llm = Ollama(model=settings.SECONDARY_MODEL, base_url=settings.OLLAMA_BASE_URL)
except Exception as e:
    print(f"Warning: Could not initialize Ollama models: {e}")

sar_prompt_template = PromptTemplate(
    input_variables=["case_data", "aml_context"],
    template="""
    You are an expert Anti-Money Laundering (AML) Compliance Officer.
    Write a formal, concise Suspicious Activity Report (SAR) narrative based on the following data:
    
    AML Guidelines Context:
    {aml_context}
    
    Suspicious Case Data:
    {case_data}
    
    Provide the narrative in a professional business tone. Clearly state why the activity was flagged, citing relevant metrics (like transaction frequency, high value flags, or rapid movements). Do not include pleasantries.
    """
)

def generate_sar_narrative(case_data: dict, aml_context: str) -> str:
    """
    RAG Pipeline Core AI brain that writes the SAR report using Llama 3.1
    """
    case_data_json = json.dumps(case_data, indent=2)
    chain = sar_prompt_template | primary_llm
    response = chain.invoke({"case_data": case_data_json, "aml_context": aml_context})
    return response

def generate_explanation(case_data: dict, feature_importance: dict = None) -> str:
    """
    Generates human-readable explanations based on SHAP feature importance.
    Processed by Mistral AI as per architecture.
    """
    # If SHAP values are provided from the ML model, include them
    shap_context = ""
    if feature_importance:
        shap_context = f"SHAP Feature Importance: {json.dumps(feature_importance)}\n"
        
    explain_prompt = PromptTemplate(
        input_variables=["case_data", "shap_context"],
        template="""
        Explain clearly and simply why this transaction data was flagged as suspicious.
        {shap_context}
        Case Data: {case_data}
        Provide a step-by-step breakdown of the risk factors.
        """
    )
    chain = explain_prompt | secondary_llm
    return chain.invoke({
        "case_data": json.dumps(case_data, indent=2),
        "shap_context": shap_context
    })
