import modal

app = modal.App("dentor-quiz")

def download_model():
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    print("Downloading Mistral Exam Generator into image...")
    model_id = "oewis16/mistral-exam-generator"

    AutoTokenizer.from_pretrained(model_id)
    # Just download weights, do not load model into memory here to save time and memory
    # HuggingFace hub handles caching via from_pretrained
    AutoModelForCausalLM.from_pretrained(
        model_id,
        device_map="cpu",
        trust_remote_code=True,
    )

image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "transformers>=4.40.0",
        "torch",
        "fastapi",
        "pydantic",
        "accelerate>=0.26.0",
        "sentencepiece",
        "protobuf",
        "bitsandbytes",
    )
    .run_function(download_model)
)

@app.cls(image=image, gpu="A10G")
class QuizGen:
    @modal.enter()
    def load_model(self):
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
        import torch
        print("Loading Mistral onto A10G GPU in 4-bit mode to prevent OOM...")
        model_id = "oewis16/mistral-exam-generator"

        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
        )

        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_id,
            quantization_config=quantization_config,
            device_map="auto",
            trust_remote_code=True,
        )
        self.model.eval()
        print("Model loaded successfully in 4-bit!")

    @modal.fastapi_endpoint(method="POST")
    def run(self, request: dict):
        text = request.get("inputs", "")
        if not text:
            return {"error": "No text provided in 'inputs' field."}

        import torch
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=3072
        ).to("cuda")

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=3072,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.15,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        print(f"Input shape: {inputs['input_ids'].shape}, Output shape: {outputs.shape}")
        
        # Decode only the new tokens (skip the prompt)
        generated_ids = outputs[0][inputs["input_ids"].shape[1]:]
        generated_text = self.tokenizer.decode(generated_ids, skip_special_tokens=True)

        return {"generated_text": generated_text}
