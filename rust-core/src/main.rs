use csv::Reader;
use xlsxwriter::*;
use std::env;
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        println!("Please provide a CSV file path");
        return Ok(());
    }           

    let input_path = &args[1];

    let mut reader = Reader::from_path(input_path)?;
    
    // Create a unique temporary file path (file doesn't exist yet, Workbook will create it)
    let temp_dir = std::env::temp_dir();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let temp_path = temp_dir.join(format!("xlsx_convert_{}.xlsx", timestamp));
    
    let workbook = Workbook::new(temp_path.to_str().unwrap())?;
    let mut sheet = workbook.add_worksheet(None)?;

    for (row_index, result) in reader.records().enumerate() {
        let record = result?;

        for (col_index, value) in record.iter().enumerate() {
            sheet.write_string(
                row_index as u32,
                col_index as u16,
                value,
                None,
            )?;
        }
    }

    workbook.close()?;
    
    // Read the temp file content into memory
    let file_data = std::fs::read(&temp_path)?;
    
    // Encode as base64 for safe transmission over stdout
    let encoded = base64_encode(&file_data);
    println!("{}", encoded);

    Ok(())
}

// Simple base64 encoding helper
fn base64_encode(data: &[u8]) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".as_slice();
    let mut result = String::new();
    let mut i = 0;
    
    while i + 3 <= data.len() {
        let b1 = data[i];
        let b2 = data[i + 1];
        let b3 = data[i + 2];
        
        let n = ((b1 as u32) << 16) | ((b2 as u32) << 8) | (b3 as u32);
        
        result.push(CHARSET[((n >> 18) & 0x3F) as usize] as char);
        result.push(CHARSET[((n >> 12) & 0x3F) as usize] as char);
        result.push(CHARSET[((n >> 6) & 0x3F) as usize] as char);
        result.push(CHARSET[(n & 0x3F) as usize] as char);
        
        i += 3;
    }
    
    match data.len() - i {
        1 => {
            let b1 = data[i];
            let n = (b1 as u32) << 16;
            result.push(CHARSET[((n >> 18) & 0x3F) as usize] as char);
            result.push(CHARSET[((n >> 12) & 0x3F) as usize] as char);
            result.push_str("==");
        }
        2 => {
            let b1 = data[i];
            let b2 = data[i + 1];
            let n = ((b1 as u32) << 16) | ((b2 as u32) << 8);
            result.push(CHARSET[((n >> 18) & 0x3F) as usize] as char);
            result.push(CHARSET[((n >> 12) & 0x3F) as usize] as char);
            result.push(CHARSET[((n >> 6) & 0x3F) as usize] as char);
            result.push('=');
        }
        _ => {}
    }
    
    result
}
