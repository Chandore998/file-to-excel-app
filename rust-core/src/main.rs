use csv::Reader;
use rust_xlsxwriter::Workbook;
use std::env;
use std::error::Error;
use base64::{engine::general_purpose, Engine};
use tempfile::NamedTempFile;

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        println!("Please provide a CSV file path");
        return Ok(());
    }           

    let input_path = &args[1];

    // Read CSV and write to Excel in memory
    let mut reader = Reader::from_path(input_path)?;

    // Create Workbook and write data to it
    let mut workbook = Workbook::new();
    let sheet = workbook.add_worksheet();

    for (row_index, result) in reader.records().enumerate() {
        let record = result?;

        for (col_index, value) in record.iter().enumerate() {
            sheet.write_string(
                row_index as u32,
                col_index as u16,
                value
            )?;
        }
    }

    let temp_file = NamedTempFile::new()?;
    let temp_path = temp_file.path().to_path_buf();

    workbook.save(&temp_path)?;

    // Read Excel bytes
    let excel_bytes = std::fs::read(&temp_path)?;

    // Convert bytes → base64
    let encoded = general_purpose::STANDARD.encode(excel_bytes);
    
    // Print base64 to Electron
    println!("{}", encoded);

    Ok(())
}
