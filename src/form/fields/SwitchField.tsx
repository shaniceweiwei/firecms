import { FormControlLabel, FormHelperText, Switch } from "@material-ui/core";
import React from "react";

import { CMSFieldProps } from "../form_props";
import { getIn } from "formik";
import { FieldDescription } from "../../util";

type SwitchFieldProps = CMSFieldProps<boolean>;

export default function SwitchField({
                                        field,
                                        form: { isSubmitting, errors, touched, setFieldValue, setFieldTouched },
                                        property,
                                        includeDescription,
                                        createFormField,
                                        ...props
                                    }: SwitchFieldProps) {


    const fieldError = getIn(errors, field.name);
    const showError = getIn(touched, field.name) && !!fieldError;

    return (
        <React.Fragment>
            <FormControlLabel
                checked={field.value}
                control={
                    <Switch
                        {...props}
                        type={"checkbox"}
                        onChange={(evt) => {
                            setFieldTouched(field.name);
                            setFieldValue(
                                field.name,
                                evt.target.checked
                            );
                        }}/>
                }
                disabled={property.disabled || isSubmitting}
                label={property.title}
            />

            {includeDescription &&
            <FieldDescription property={property}/>}

            {showError && <FormHelperText
                id="component-error-text">{fieldError}</FormHelperText>}
        </React.Fragment>
    );
}

